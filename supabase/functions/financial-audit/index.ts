import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'run';
    const mode = url.searchParams.get('mode') ?? 'light';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (action === 'status') {
      const { data: openIssues } = await supabase
        .from('financial_audit_logs')
        .select('level', { count: 'exact' })
        .eq('status', 'open');
      const counts = { high: 0, medium: 0, low: 0 };
      (openIssues ?? []).forEach((r: any) => { counts[r.level as keyof typeof counts]++; });
      const { data: lastRun } = await supabase
        .from('financial_audit_logs')
        .select('created_at, audit_run_id')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      return Response.json({ ok: true, open_by_level: counts, last_run_at: lastRun?.created_at ?? null }, { headers: corsHeaders });
    }

    if (action === 'logs') {
      const { data, error } = await supabase
        .from('financial_audit_logs').select('*')
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return Response.json({ ok: true, logs: data }, { headers: corsHeaders });
    }

    // Default: run audit
    const { data, error } = await supabase.rpc('run_financial_audit', { _mode: mode });
    if (error) throw error;
    return Response.json({ ok: true, result: data }, { headers: corsHeaders });
  } catch (e) {
    console.error('[financial-audit]', e);
    return Response.json({ ok: false, error: String((e as Error).message) }, { status: 500, headers: corsHeaders });
  }
});
