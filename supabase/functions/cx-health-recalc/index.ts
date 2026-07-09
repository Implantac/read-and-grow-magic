// Recalcula Customer Health Score de todos os clientes ativos da empresa.
// Usa pesos configuráveis em cx_health_weights (fallback default).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'unauthorized' }, 401);

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

    const { data: wRow } = await admin.from('cx_health_weights').select('weights').eq('company_id', companyId).maybeSingle();
    const w = wRow?.weights ?? {
      purchase_frequency: 20, purchase_value: 15, recency: 15, nps: 20,
      tickets: 10, overdue_payments: 10, returns: 5, engagement: 5,
    };

    const { data: clients } = await admin
      .from('clients')
      .select('id')
      .eq('company_id', companyId)
      .limit(500);
    if (!clients?.length) return json({ ok: true, processed: 0 });

    const rows: any[] = [];
    for (const c of clients) {
      const [orders, nps, ap] = await Promise.all([
        admin.from('orders').select('total_value, created_at').eq('company_id', companyId).eq('client_id', c.id).order('created_at', { ascending: false }).limit(50),
        admin.from('nps_answers').select('score, responded_at').eq('company_id', companyId).eq('client_id', c.id).order('responded_at', { ascending: false }).limit(20),
        admin.from('accounts_receivable').select('due_date, status').eq('company_id', companyId).eq('client_id', c.id).limit(50),
      ]);

      const ordersData = orders.data ?? [];
      const npsData = nps.data ?? [];
      const apData = ap.data ?? [];

      // Fatores 0..1
      const freq = Math.min(ordersData.length / 12, 1);
      const value = Math.min(ordersData.reduce((s, o: any) => s + Number(o.total_value ?? 0), 0) / 50000, 1);
      const lastOrder = ordersData[0]?.created_at ? (Date.now() - new Date(ordersData[0].created_at).getTime()) / (1000 * 60 * 60 * 24) : 365;
      const recency = Math.max(0, 1 - lastOrder / 180);
      const avgNps = npsData.length ? npsData.reduce((s, n: any) => s + Number(n.score), 0) / npsData.length / 10 : 0.6;
      const overdue = apData.filter((r: any) => r.status === 'overdue').length;
      const overduePenalty = Math.max(0, 1 - overdue / 5);
      const tickets = 1; // sem módulo de chamados vinculado ainda
      const returns = 1;
      const engagement = Math.min((npsData.length + ordersData.length) / 20, 1);

      const raw =
        w.purchase_frequency * freq +
        w.purchase_value * value +
        w.recency * recency +
        w.nps * avgNps +
        w.tickets * tickets +
        w.overdue_payments * overduePenalty +
        w.returns * returns +
        w.engagement * engagement;

      const totalW = Object.values(w).reduce((a: number, b: any) => a + Number(b), 0);
      const score = Math.round((raw / totalW) * 100);
      const tier = score >= 85 ? 'excellent' : score >= 65 ? 'good' : score >= 40 ? 'attention' : 'critical';

      rows.push({
        company_id: companyId,
        client_id: c.id,
        score,
        tier,
        factors: { freq, value, recency, avgNps, overduePenalty, engagement },
        computed_at: new Date().toISOString(),
      });
    }

    // upsert em lote
    const { error } = await admin.from('cx_health_scores').upsert(rows, { onConflict: 'company_id,client_id' });
    if (error) throw error;

    return json({ ok: true, processed: rows.length });
  } catch (e: any) {
    console.error('cx-health-recalc', e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
