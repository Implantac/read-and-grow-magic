import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Gera convites + tokens únicos para uma lista de clientes de uma campanha.
// Requer autenticação; usa a role de serviço para inserir tokens.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);

    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await anon.auth.getUser();
    if (userErr || !userData?.user?.id) {
      console.error('nps-generate-invites auth error', userErr);
      return json({ error: 'Não autenticado' }, 401);
    }
    const userId = userData.user.id;

    const { campaign_id, client_ids, channel = 'link', expires_in_days } = await req.json();
    if (!campaign_id || !Array.isArray(client_ids) || client_ids.length === 0) {
      return json({ error: 'Parâmetros inválidos' }, 400);
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: campaign } = await admin.from('nps_campaigns').select('id,company_id').eq('id', campaign_id).maybeSingle();
    if (!campaign) return json({ error: 'Campanha inexistente' }, 404);

    const { data: profile } = await admin.from('profiles').select('company_id').eq('id', userId).maybeSingle();
    if (!profile || profile.company_id !== campaign.company_id) return json({ error: 'Sem permissão' }, 403);

    const expires_at = expires_in_days ? new Date(Date.now() + expires_in_days * 86400000).toISOString() : null;

    const invitesRows = client_ids.map((cid: string) => ({
      company_id: campaign.company_id,
      campaign_id,
      client_id: cid,
      channel,
      status: 'pending',
    }));
    const { data: invites, error: invErr } = await admin.from('nps_invites').insert(invitesRows).select();
    if (invErr) throw invErr;

    const tokensRows = invites.map((inv) => ({
      company_id: campaign.company_id,
      campaign_id,
      invite_id: inv.id,
      client_id: inv.client_id,
      token: crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2, 10),
      expires_at,
    }));
    const { data: tokens, error: tokErr } = await admin.from('nps_tokens').insert(tokensRows).select();
    if (tokErr) throw tokErr;

    await admin.from('nps_logs').insert({
      company_id: campaign.company_id, campaign_id, event: 'invite.batch_created',
      payload: { count: invites.length }, user_id: userId,
    });

    return json({ ok: true, invites, tokens });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
