import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Analisa comentário de uma resposta NPS via Lovable AI Gateway.
// Extrai: sentiment (positive/neutral/negative), summary, categories[], keywords[].

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);
  try {
    const { answer_id } = await req.json();
    if (!answer_id) return json({ error: 'answer_id obrigatório' }, 400);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: ans } = await admin.from('nps_answers').select('id, score, category, comment').eq('id', answer_id).maybeSingle();
    if (!ans || !ans.comment) return json({ ok: true, skipped: true });

    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return json({ error: 'AI indisponível' }, 500);

    const prompt = `Você analisa comentários de pesquisas NPS em português. Comentário (nota ${ans.score}, categoria ${ans.category}): """${ans.comment}"""\nResponda APENAS JSON válido: {"sentiment":"positive|neutral|negative","summary":"até 140 chars","categories":["ate 3"],"keywords":["ate 5"]}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) return json({ error: `AI ${resp.status}: ${await resp.text()}` }, resp.status);
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    await admin.from('nps_answers').update({
      sentiment: parsed.sentiment ?? null,
      ai_summary: parsed.summary ?? null,
      ai_categories: parsed.categories ?? [],
      ai_keywords: parsed.keywords ?? [],
    }).eq('id', answer_id);

    return json({ ok: true, ...parsed });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
