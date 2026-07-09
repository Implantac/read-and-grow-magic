// Dispara webhooks NPS assinados com HMAC-SHA256. Chamado internamente ou via HTTP.
// Body: { company_id, event, payload }
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body { company_id: string; event: string; payload: any }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Chamada interna: requer service-role no header ou JWT válido
    const auth = req.headers.get('Authorization') ?? '';
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const url = Deno.env.get('SUPABASE_URL')!;
    const isInternal = auth === `Bearer ${service}`;

    const admin = createClient(url, service);
    let companyId: string | null = null;

    const body = (await req.json()) as Body;
    if (!body?.event || !body?.payload) return json({ error: 'invalid' }, 400);

    if (isInternal) {
      companyId = body.company_id;
    } else {
      const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
      const uc = createClient(url, anon, { global: { headers: { Authorization: auth } } });
      const { data: u } = await uc.auth.getUser();
      if (!u.user) return json({ error: 'unauthorized' }, 401);
      const { data: p } = await admin.from('profiles').select('company_id').eq('id', u.user.id).maybeSingle();
      companyId = p?.company_id ?? null;
    }
    if (!companyId) return json({ error: 'no_company' }, 400);

    const { data: hooks } = await admin
      .from('nps_webhooks')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true);

    const targets = (hooks ?? []).filter((h: any) => Array.isArray(h.events) && (h.events.includes(body.event) || h.events.includes('*')));
    const results: any[] = [];

    for (const h of targets) {
      const ts = new Date().toISOString();
      const bodyStr = JSON.stringify({ event: body.event, ts, data: body.payload });
      let signature = '';
      if (h.secret) {
        signature = await hmacSHA256(h.secret, bodyStr);
      }
      let status = 0;
      let attempt = 0;
      let ok = false;
      // Retry exponencial: 3 tentativas
      while (attempt < 3 && !ok) {
        try {
          const resp = await fetch(h.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-NPS-Event': body.event,
              'X-NPS-Signature': signature,
              'X-NPS-Timestamp': ts,
            },
            body: bodyStr,
          });
          status = resp.status;
          ok = resp.ok;
        } catch (e) {
          status = 0;
        }
        if (!ok && attempt < 2) await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
        attempt++;
      }
      await admin.from('nps_webhooks').update({ last_delivery_at: ts, last_status: status }).eq('id', h.id);
      await admin.from('nps_logs').insert({
        company_id: companyId,
        event: `webhook.${ok ? 'sent' : 'failed'}`,
        payload: { webhook_id: h.id, url: h.url, status, event: body.event, attempts: attempt },
      });
      results.push({ webhook_id: h.id, ok, status });
    }

    return json({ dispatched: results.length, results });
  } catch (e: any) {
    console.error('nps-webhooks-dispatch', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

async function hmacSHA256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
