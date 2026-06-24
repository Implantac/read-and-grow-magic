import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireAuth } from '../_shared/require-auth.ts';
import { resolveContext } from '../_shared/tenant.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-branch-id',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ['admin', 'manager'], allowCron: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ctx = await resolveContext(req, auth);
  if (!ctx.ok) {
    return new Response(JSON.stringify({ error: ctx.message }), {
      status: ctx.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'run';
    const mode = url.searchParams.get('mode') ?? 'light';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const callerCompany = ctx.companyId;
    if (!callerCompany && !ctx.viaCron) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      let q = supabase
        .from('financial_audit_logs')
        .select('level', { count: 'exact' })
        .eq('status', 'open');
      if (callerCompany) q = q.eq('company_id', callerCompany);
      const { data: openIssues } = await q;
      const counts = { high: 0, medium: 0, low: 0 };
      (openIssues ?? []).forEach((r: any) => { counts[r.level as keyof typeof counts]++; });
      let qLast = supabase
        .from('financial_audit_logs')
        .select('created_at, audit_run_id')
        .order('created_at', { ascending: false }).limit(1);
      if (callerCompany) qLast = qLast.eq('company_id', callerCompany);
      const { data: lastRun } = await qLast.maybeSingle();
      return Response.json({ ok: true, open_by_level: counts, last_run_at: lastRun?.created_at ?? null }, { headers: corsHeaders });
    }

    if (action === 'logs') {
      let q = supabase
        .from('financial_audit_logs').select('*')
        .order('created_at', { ascending: false }).limit(100);
      if (callerCompany) q = q.eq('company_id', callerCompany);
      const { data, error } = await q;
      if (error) throw error;
      return Response.json({ ok: true, logs: data }, { headers: corsHeaders });
    }


    // Default: run audit
    const { data, error } = await supabase.rpc('run_financial_audit', { _mode: mode });
    if (error) throw error;
    return Response.json({ ok: true, result: data }, { headers: corsHeaders });
  } catch (e) {
    console.error('[financial-audit]', e);
    return Response.json({ ok: false, error: 'Erro interno. Tente novamente.' }, { status: 500, headers: corsHeaders });
  }
});
