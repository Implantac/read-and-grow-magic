// Cluster automático de comentários NPS por tema, usando Lovable AI.
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

    const body = await req.json().catch(() => ({}));
    const days = Number(body.days ?? 30);
    const campaignId = body.campaign_id ?? null;
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    let q = admin.from('nps_answers')
      .select('score, category, comment, responded_at')
      .eq('company_id', companyId)
      .not('comment', 'is', null)
      .gte('responded_at', since)
      .limit(500);
    if (campaignId) q = q.eq('campaign_id', campaignId);
    const { data: answers } = await q;
    const comments = (answers ?? []).filter((a: any) => (a.comment ?? '').length > 5);
    if (!comments.length) return json({ ok: true, clusters: [], total: 0 });

    const list = comments.map((c: any, i: number) => `[${i}] (${c.score}) ${c.comment.slice(0, 300)}`).join('\n');
    const prompt = `Agrupe os comentários abaixo em 3-8 clusters temáticos (PT-BR).
Cada cluster deve ter: name (curto), sentiment (positive|neutral|negative), count, sample (2 exemplos curtos), keywords ([str]).
Responda JSON estrito: {"clusters":[...]}. Comentários:\n${list}`;

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
    let parsed: any = {};
    try { parsed = JSON.parse(j.choices?.[0]?.message?.content ?? '{}'); } catch { parsed = { clusters: [] }; }

    const { data: inserted, error } = await admin.from('cx_comment_clusters').insert({
      company_id: companyId,
      campaign_id: campaignId,
      period_start: since,
      period_end: new Date().toISOString(),
      clusters: parsed.clusters ?? [],
      total_comments: comments.length,
    }).select().single();
    if (error) throw error;

    return json({ ok: true, id: inserted.id, clusters: parsed.clusters ?? [], total: comments.length });
  } catch (e: any) {
    console.error('cx-ai-cluster', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
