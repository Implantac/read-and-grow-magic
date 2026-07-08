import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!token) return json({ error: 'Token obrigatório' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: tok, error: tokErr } = await admin
      .from('nps_tokens')
      .select('id, company_id, campaign_id, client_id, single_use, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();

    if (tokErr || !tok) return json({ error: 'Token inválido' }, 404);
    if (tok.expires_at && new Date(tok.expires_at) < new Date()) return json({ error: 'Token expirado' }, 410);
    if (tok.single_use && tok.used_at) return json({ error: 'Pesquisa já respondida' }, 410);

    const [{ data: campaign }, { data: questions }, { data: company }] = await Promise.all([
      admin.from('nps_campaigns').select('id,name,title,subtitle,message,logo_url,primary_color,banner_url,thanks_title,thanks_message,require_open_comment,status,start_date,end_date').eq('id', tok.campaign_id).maybeSingle(),
      admin.from('nps_questions').select('id,order_index,question_text,question_type,required,options,condition').eq('campaign_id', tok.campaign_id).order('order_index'),
      admin.from('companies').select('id,name,logo_url').eq('id', tok.company_id).maybeSingle(),
    ]);

    if (!campaign || !['active','scheduled'].includes(campaign.status)) return json({ error: 'Pesquisa indisponível' }, 410);

    return json({ campaign, questions: questions ?? [], company, token });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
