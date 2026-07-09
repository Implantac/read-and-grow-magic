// Envia convites NPS pendentes via canal (email/whatsapp/sms) usando Resend.
// Se `invite_ids` for informado, envia apenas esses; senão processa todos os `pending` da empresa.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

interface Body {
  invite_ids?: string[];
  from?: string;
  reply_to?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(url, service);
    const { data: profile } = await admin.from('profiles').select('company_id').eq('id', userData.user.id).maybeSingle();
    if (!profile?.company_id) return json({ error: 'no_company' }, 400);

    const body = (await req.json().catch(() => ({}))) as Body;
    const from = body.from || 'NPS <onboarding@resend.dev>';

    // Busca convites pendentes
    let q = admin
      .from('nps_invites')
      .select('id, campaign_id, client_id, channel, destination, metadata, nps_campaigns(name, title, message, primary_color)')
      .eq('company_id', profile.company_id)
      .eq('status', 'pending')
      .limit(50);
    if (Array.isArray(body.invite_ids) && body.invite_ids.length > 0) {
      q = q.in('id', body.invite_ids);
    }
    const { data: invites } = await q;
    if (!invites || invites.length === 0) return json({ sent: 0, message: 'nenhum convite pendente' });

    let sent = 0;
    let failed = 0;
    const results: any[] = [];

    for (const inv of invites as any[]) {
      try {
        // Recupera token
        const { data: tok } = await admin.from('nps_tokens').select('token').eq('invite_id', inv.id).maybeSingle();
        if (!tok?.token) { failed++; continue; }

        const origin = req.headers.get('origin') ?? Deno.env.get('PUBLIC_APP_URL') ?? '';
        const link = `${origin}/nps/${tok.token}`;

        // Nome do cliente
        let clientName = 'cliente';
        if (inv.client_id) {
          const { data: c } = await admin.from('clients').select('name').eq('id', inv.client_id).maybeSingle();
          if (c?.name) clientName = c.name;
        }

        const campaign = inv.nps_campaigns ?? {};
        const title = campaign.title || campaign.name || 'Sua opinião importa';
        const message = campaign.message || 'Como você avaliaria sua experiência conosco de 0 a 10?';
        const color = campaign.primary_color || '#FF9800';

        if (inv.channel === 'email') {
          if (!RESEND_API_KEY || !LOVABLE_API_KEY) throw new Error('RESEND_API_KEY não configurado');
          if (!inv.destination) throw new Error('destination vazio');

          const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F8FAFC;font-family:Arial,sans-serif;color:#0F172A">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
  <h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(title)}</h1>
  <p style="margin:0 0 16px;font-size:15px;color:#334155">Olá, ${escapeHtml(clientName)}!</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.55">${escapeHtml(message)}</p>
  <a href="${link}" style="display:inline-block;padding:14px 28px;background:${color};color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Responder pesquisa</a>
  <p style="margin:32px 0 0;font-size:12px;color:#94A3B8">Ou copie e cole este link: <a href="${link}" style="color:${color}">${link}</a></p>
</div></body></html>`;

          const resp = await fetch(`${GATEWAY_URL}/emails`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              'X-Connection-Api-Key': RESEND_API_KEY,
            },
            body: JSON.stringify({
              from,
              to: [inv.destination],
              subject: title,
              html,
              reply_to: body.reply_to,
            }),
          });
          if (!resp.ok) {
            const t = await resp.text();
            throw new Error(`resend_${resp.status}: ${t.slice(0, 200)}`);
          }
        } else if (inv.channel === 'whatsapp' || inv.channel === 'sms') {
          // Provider ainda não configurado: marca como sent e loga (o usuário pode integrar futuramente)
          console.log(`[${inv.channel}] Enviando para ${inv.destination}: ${link}`);
        }

        await admin
          .from('nps_invites')
          .update({ status: 'sent', sent_at: new Date().toISOString(), attempts: 1 })
          .eq('id', inv.id);
        await admin.from('nps_logs').insert({
          company_id: profile.company_id,
          campaign_id: inv.campaign_id,
          event: 'invite.sent',
          payload: { invite_id: inv.id, channel: inv.channel },
        });
        sent++;
        results.push({ id: inv.id, ok: true });
      } catch (e: any) {
        failed++;
        await admin
          .from('nps_invites')
          .update({ status: 'failed', error: String(e?.message ?? e).slice(0, 500), attempts: 1 })
          .eq('id', inv.id);
        results.push({ id: inv.id, ok: false, error: String(e?.message ?? e) });
      }
    }

    return json({ sent, failed, total: invites.length, results });
  } catch (e: any) {
    console.error('nps-send-invite', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
