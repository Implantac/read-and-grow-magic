import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSystemPrompt } from '../_shared/ai-prompts.ts';
import { requireAuth } from '../_shared/require-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ['admin', 'manager'], allowCron: true });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );


  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'compute';

    if (action === 'compute') {
      const [{ data: score, error: e1 }, { data: risks, error: e2 }] = await Promise.all([
        supabase.rpc('calculate_financial_health_score'),
        supabase.rpc('detect_cashflow_risks'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return Response.json({ ok: true, score, risks }, { headers: corsHeaders });
    }

    if (action === 'auto-reconcile') {
      const { data: pending } = await supabase
        .from('bank_transactions').select('id').neq('status', 'matched').limit(200);
      let matched = 0;
      for (const tx of pending ?? []) {
        const { data } = await supabase.rpc('match_bank_transaction', { _bank_tx_id: tx.id });
        if ((data as any)?.matched_entry_id) matched++;
      }
      return Response.json({ ok: true, processed: pending?.length ?? 0, matched }, { headers: corsHeaders });
    }

    return Response.json({ ok: false, error: 'unknown action' }, { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error('[financial-intelligence]', e);
    return Response.json({ ok: false, error: String((e as Error).message) }, { status: 500, headers: corsHeaders });
  }
});
