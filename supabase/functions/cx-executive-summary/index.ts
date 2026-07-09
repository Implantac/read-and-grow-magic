// Gera resumo executivo do CX (NPS + Health + Churn + comentários) via Lovable AI.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'unauthorized' }, 401);
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'missing_lovable_api_key' }, 500);

    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;

    const user = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: u } = await user.auth.getUser();
    if (!u.user) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(url, service);
    const { data: prof } = await admin.from('profiles').select('company_id').eq('id', u.user.id).maybeSingle();
    const companyId = prof?.company_id;
    if (!companyId) return json({ error: 'no_company' }, 400);

    const days = Number(new URL(req.url).searchParams.get('days') ?? 30);
    const start = new Date(Date.now() - days * 86400_000).toISOString();
    const end = new Date().toISOString();

    const [ans, health, churn] = await Promise.all([
      admin.from('nps_answers').select('score, category, comment').eq('company_id', companyId).gte('responded_at', start).limit(500),
      admin.from('cx_health_scores').select('tier').eq('company_id', companyId),
      admin.from('cx_churn_predictions').select('risk_level, probability').eq('company_id', companyId),
    ]);
    const answers = ans.data ?? [];
    const promoters = answers.filter((a: any) => a.category === 'promoter').length;
    const detractors = answers.filter((a: any) => a.category === 'detractor').length;
    const total = answers.length || 1;
    const nps = Math.round(((promoters - detractors) / total) * 100);

    const tiers = (health.data ?? []).reduce((acc: any, r: any) => { acc[r.tier] = (acc[r.tier] ?? 0) + 1; return acc; }, {});
    const critical = (churn.data ?? []).filter((r: any) => r.risk_level === 'critical').length;
    const sampleComments = answers.filter((a: any) => a.comment).slice(0, 30).map((a: any) => `(${a.score}) ${a.comment.slice(0, 160)}`).join('\n');

    const prompt = `Você é diretor de CX. Gere um resumo executivo curto (PT-BR) sobre os últimos ${days} dias.
Métricas: NPS=${nps}, respostas=${answers.length}, promotores=${promoters}, detratores=${detractors}, health=${JSON.stringify(tiers)}, clientes churn crítico=${critical}.
Comentários amostra:\n${sampleComments}

Responda JSON estrito: {"summary":"...", "insights":[str,...], "recommendations":[str,...]}. Seja executivo, direto, sem jargão.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) throw new Error(`ai_${resp.status}`);
    const j = await resp.json();
    let p: any = {};
    try { p = JSON.parse(j.choices?.[0]?.message?.content ?? '{}'); } catch { p = {}; }

    const { data: inserted, error } = await admin.from('cx_executive_summaries').insert({
      company_id: companyId,
      period_start: start,
      period_end: end,
      summary: p.summary ?? '',
      key_insights: p.insights ?? [],
      recommendations: p.recommendations ?? [],
      metrics: { nps, promoters, detractors, total: answers.length, tiers, critical },
    }).select().single();
    if (error) throw error;
    return json({ ok: true, id: inserted.id, ...p, metrics: { nps, promoters, detractors, total: answers.length, tiers, critical } });
  } catch (e: any) {
    console.error('cx-executive-summary', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
