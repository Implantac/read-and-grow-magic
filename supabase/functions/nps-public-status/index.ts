import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Retorna o status da análise IA de uma resposta NPS pública.
// Autoriza pelo token público (sem JWT). Response:
// { status: 'pending' | 'complete' | 'skipped', sentiment?, summary?, categories?, keywords? }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') ?? '';
    if (!token) return json({ error: 'token obrigatório' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: tok } = await admin.from('nps_tokens').select('id').eq('token', token).maybeSingle();
    if (!tok) return json({ error: 'Token inválido' }, 404);

    const { data: ans } = await admin
      .from('nps_answers')
      .select('id, comment, sentiment, ai_summary, ai_categories, ai_keywords')
      .eq('token_id', tok.id)
      .order('responded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!ans) return json({ status: 'pending' });

    if (!ans.comment || ans.comment.length <= 5) return json({ status: 'skipped' });
    if (ans.sentiment) {
      return json({
        status: 'complete',
        sentiment: ans.sentiment,
        summary: ans.ai_summary,
        categories: ans.ai_categories ?? [],
        keywords: ans.ai_keywords ?? [],
      });
    }
    return json({ status: 'pending' });
  } catch (e) {
    console.error('nps-public-status', e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
