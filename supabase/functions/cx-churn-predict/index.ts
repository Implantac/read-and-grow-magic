// Prediz probabilidade de churn por cliente usando Lovable AI + sinais do ERP.
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

    // Foca em clientes com queda ou detrator recente
    const { data: health } = await admin
      .from('cx_health_scores')
      .select('client_id, score, tier, factors')
      .eq('company_id', companyId)
      .in('tier', ['attention', 'critical'])
      .order('score')
      .limit(50);
    if (!health?.length) return json({ ok: true, processed: 0 });

    const rows: any[] = [];
    for (const h of health) {
      // Heurística base (0..100)
      const base = 100 - h.score;
      const [nps, orders] = await Promise.all([
        admin.from('nps_answers').select('score, comment, responded_at').eq('client_id', h.client_id).order('responded_at', { ascending: false }).limit(5),
        admin.from('orders').select('total_value, created_at').eq('client_id', h.client_id).order('created_at', { ascending: false }).limit(5),
      ]);

      const prompt = `Você é analista de retenção de clientes. Baseado nos sinais:
- Health score: ${h.score}/100 (${h.tier})
- Fatores: ${JSON.stringify(h.factors)}
- Últimas notas NPS: ${JSON.stringify((nps.data ?? []).map((n: any) => ({ score: n.score, when: n.responded_at, comment: (n.comment ?? '').slice(0, 120) })))}
- Últimos pedidos: ${JSON.stringify((orders.data ?? []).map((o: any) => ({ value: o.total_value, when: o.created_at })))}

Responda em JSON estrito: {"probability": 0-100, "risk_level":"low|medium|high|critical", "reasons":[str,...], "summary":"...", "actions":[str,...]}.
Seja objetivo e em PT-BR.`;

      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });
      if (!resp.ok) { console.warn('ai fail', await resp.text()); continue; }
      const j = await resp.json();
      let parsed: any = {};
      try { parsed = JSON.parse(j.choices?.[0]?.message?.content ?? '{}'); } catch { /* skip */ }

      const probability = Math.max(base, Math.min(100, Number(parsed.probability ?? base)));
      const risk_level = probability >= 80 ? 'critical' : probability >= 60 ? 'high' : probability >= 35 ? 'medium' : 'low';

      rows.push({
        company_id: companyId,
        client_id: h.client_id,
        probability,
        risk_level,
        reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        ai_summary: parsed.summary ?? null,
        suggested_actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        predicted_at: new Date().toISOString(),
      });
    }

    if (rows.length) {
      const { error } = await admin.from('cx_churn_predictions').upsert(rows, { onConflict: 'company_id,client_id' });
      if (error) throw error;
    }
    return json({ ok: true, processed: rows.length });
  } catch (e: any) {
    console.error('cx-churn-predict', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
