import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireAuth } from '../_shared/require-auth.ts';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { verifyHmacSignature } from '../_shared/hmac.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pix-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'webhook';

    // Rate limit by client IP (60 req/min) — public webhook surface
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = checkRateLimit({ key: `pix-webhook:${ip}:${action}`, limit: 60, windowMs: 60_000 });
    if (!rl.allowed) {
      console.warn(`[pix-webhook] rate limit hit for ip=${ip} action=${action}`);
      return rateLimitResponse(rl, corsHeaders);
    }


    // User-initiated actions: require admin/manager JWT.
    if (action === 'create' || action === 'simulate-payment') {
      const auth = await requireAuth(req, { roles: ['admin', 'manager'] });
      if (!auth.ok) {
        return new Response(JSON.stringify({ error: auth.message }), {
          status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // simulate-payment is a test-only utility; disable in production unless explicitly enabled.
      if (action === 'simulate-payment' && Deno.env.get('PIX_SIMULATION_ENABLED') !== 'true') {
        return new Response(JSON.stringify({ error: 'Simulation disabled' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    // Simulação: criar cobrança PIX
    if (action === 'create' && req.method === 'POST') {
      const body = await req.json();
      const { receivable_id, amount, client_name, client_id, description, expires_minutes = 60, bank_account_id } = body;
      if (!amount || amount <= 0) {
        return Response.json({ ok: false, error: 'amount obrigatório' }, { status: 400, headers: corsHeaders });
      }
      const txid = 'TX' + crypto.randomUUID().replace(/-/g, '').slice(0, 24).toUpperCase();
      const expires_at = new Date(Date.now() + expires_minutes * 60 * 1000).toISOString();
      const copy_paste = `00020126580014BR.GOV.BCB.PIX0136${crypto.randomUUID()}5204000053039865802BR5913USE SISTEMAS6009SAO PAULO62070503***6304XXXX`;

      const { data, error } = await supabase.from('pix_charges').insert({
        external_id: txid, txid, receivable_id, amount, client_name, client_id,
        description, copy_paste, qr_code: copy_paste, expires_at, bank_account_id,
      }).select().single();
      if (error) throw error;
      return Response.json({ ok: true, charge: data }, { headers: corsHeaders });
    }

    // Simulação: marcar como paga (para testes)
    if (action === 'simulate-payment' && req.method === 'POST') {
      const { charge_id, payer_name = 'Pagador Teste', payer_doc = '00000000000' } = await req.json();
      const e2e = 'E' + Date.now() + crypto.randomUUID().slice(0, 8);
      const { data, error } = await supabase.rpc('process_pix_payment', {
        _pix_charge_id: charge_id, _payer_name: payer_name, _payer_doc: payer_doc, _e2e_id: e2e,
      });
      if (error) throw error;
      return Response.json({ ok: true, result: data }, { headers: corsHeaders });
    }

    // Webhook real — assinatura HMAC obrigatória.
    const signature = req.headers.get('x-pix-signature') ?? '';
    const expectedSig = Deno.env.get('PIX_WEBHOOK_SECRET');
    if (!expectedSig) {
      console.error('PIX_WEBHOOK_SECRET not configured');
      return Response.json({ error: 'misconfigured' }, { status: 500, headers: corsHeaders });
    }
    if (signature !== expectedSig) {
      return Response.json({ error: 'invalid signature' }, { status: 401, headers: corsHeaders });
    }
    const payload = await req.json();


    // idempotência
    const eventId = payload.endToEndId ?? payload.txid ?? crypto.randomUUID();
    const { data: existing } = await supabase
      .from('pix_webhook_events').select('id, processed').eq('event_id', eventId).maybeSingle();
    if (existing?.processed) {
      return Response.json({ ok: true, duplicate: true }, { headers: corsHeaders });
    }

    const { data: ev } = await supabase.from('pix_webhook_events').insert({
      event_id: eventId, txid: payload.txid, end_to_end_id: payload.endToEndId,
      payload, signature,
    }).select().single();

    // localizar cobrança
    const { data: charge } = await supabase
      .from('pix_charges').select('*').eq('txid', payload.txid).maybeSingle();
    if (!charge) {
      await supabase.from('pix_webhook_events').update({ error_message: 'charge_not_found' }).eq('id', ev.id);
      return Response.json({ ok: false, error: 'charge_not_found' }, { status: 404, headers: corsHeaders });
    }

    const { data: result, error: rpcErr } = await supabase.rpc('process_pix_payment', {
      _pix_charge_id: charge.id,
      _payer_name: payload.payerName ?? '',
      _payer_doc: payload.payerDocument ?? '',
      _e2e_id: payload.endToEndId ?? '',
    });
    if (rpcErr) throw rpcErr;

    await supabase.from('pix_webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', ev.id);
    return Response.json({ ok: true, result }, { headers: corsHeaders });
  } catch (e) {
    console.error('[pix-webhook]', e);
    return Response.json({ ok: false, error: String((e as Error).message) }, { status: 500, headers: corsHeaders });
  }
});
