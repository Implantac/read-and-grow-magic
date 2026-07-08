import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSystemPrompt } from '../_shared/ai-prompts.ts';
import { requireAuth } from '../_shared/require-auth.ts';
import { resolveContext, requireModule } from '../_shared/tenant.ts';
import { instrument, contextFromAuth } from "../_shared/observability.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-branch-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface Insight {
  type: 'alert' | 'recommendation' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric?: string;
  value?: number;
}

const handler = async (req: Request): Promise<Response> => {
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
  const moduleDenied = await requireModule(ctx, 'financeiro');
  if (moduleDenied) return moduleDenied;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const callerCompany = ctx.companyId;
    if (!callerCompany) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Branch scope: when caller sent x-branch-id, restrict to that branch;
    // otherwise span all branches the user can access in the company.
    const requestedBranch = req.headers.get('x-branch-id');
    const branchScope = requestedBranch ? [ctx.branchId!] : ctx.branchIds;
    const scopeBranch = <T extends { in: any }>(q: T) =>
      branchScope.length > 0 ? (q as any).in('branch_id', branchScope) : q;

    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const d30 = new Date(today); d30.setDate(d30.getDate() - 30);
    const d60 = new Date(today); d60.setDate(d60.getDate() - 60);
    const future30 = new Date(today); future30.setDate(future30.getDate() + 30);
    const future60 = new Date(today); future60.setDate(future60.getDate() + 60);
    const future90 = new Date(today); future90.setDate(future90.getDate() + 90);

    const [banksRes, ledger30Res, ledger60Res, recRes, payRes] = await Promise.all([
      supabase.from('bank_accounts').select('balance').eq('active', true).eq('company_id', callerCompany),
      scopeBranch(supabase.from('financial_ledger').select('type,amount,entry_date,category_id').gte('entry_date', iso(d30)).eq('company_id', callerCompany)),
      scopeBranch(supabase.from('financial_ledger').select('type,amount,entry_date').gte('entry_date', iso(d60)).lt('entry_date', iso(d30)).eq('company_id', callerCompany)),
      // AR/AP: definição canônica (mesmo filtro do Dashboard/Cérebro) — status='pending', campo 'amount'.
      scopeBranch(supabase.from('accounts_receivable').select('amount,due_date,status').eq('status', 'pending').eq('company_id', callerCompany)),
      scopeBranch(supabase.from('accounts_payable').select('amount,due_date,status').eq('status', 'pending').eq('company_id', callerCompany)),
    ]);


    const currentBalance = (banksRes.data ?? []).reduce((s: number, b: any) => s + Number(b.balance ?? 0), 0);
    const ledger30 = ledger30Res.data ?? [];
    const ledger60 = ledger60Res.data ?? [];

    const sumBy = (arr: any[], type: string) =>
      arr.filter(e => e.type === type).reduce((s, e) => s + Number(e.amount), 0);

    const inflow30d = sumBy(ledger30, 'inflow');
    const outflow30d = sumBy(ledger30, 'outflow');
    const outflowPrev = sumBy(ledger60, 'outflow');
    const netCashFlow30d = inflow30d - outflow30d;
    const expenseGrowth = outflowPrev > 0 ? ((outflow30d - outflowPrev) / outflowPrev) * 100 : 0;

    const todayStr = iso(today);
    const overdueReceivable = (recRes.data ?? [])
      .filter((r: any) => r.due_date < todayStr)
      .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const overduePayable = (payRes.data ?? [])
      .filter((p: any) => p.due_date < todayStr)
      .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    const projectIn = (limit: string) => (recRes.data ?? [])
      .filter((r: any) => r.due_date >= todayStr && r.due_date <= limit)
      .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const projectOut = (limit: string) => (payRes.data ?? [])
      .filter((p: any) => p.due_date >= todayStr && p.due_date <= limit)
      .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    const projectedBalance30d = currentBalance + projectIn(iso(future30)) - projectOut(iso(future30));
    const projectedBalance60d = currentBalance + projectIn(iso(future60)) - projectOut(iso(future60));
    const projectedBalance90d = currentBalance + projectIn(iso(future90)) - projectOut(iso(future90));

    // Score 0-100
    let score = 50;
    if (currentBalance > 0) score += 15;
    if (netCashFlow30d > 0) score += 15;
    if (projectedBalance30d > 0) score += 10;
    if (projectedBalance90d > 0) score += 5;
    if (overdueReceivable === 0) score += 5;
    if (overduePayable === 0) score += 5;
    if (currentBalance < 0) score -= 25;
    if (netCashFlow30d < 0) score -= 10;
    if (projectedBalance30d < 0) score -= 15;
    if (expenseGrowth > 20) score -= 10;
    score = Math.max(0, Math.min(100, score));
    const scoreGrade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E';

    const insights: Insight[] = [];

    if (projectedBalance30d < 0) {
      insights.push({
        type: 'alert', severity: 'critical',
        title: 'Saldo projetado negativo em 30 dias',
        description: `Projeção indica saldo de R$ ${projectedBalance30d.toFixed(2)} em 30 dias. Reveja contas a pagar ou acelere recebimentos.`,
        metric: 'projected_30d', value: projectedBalance30d,
      });
    }
    if (overdueReceivable > 0) {
      insights.push({
        type: 'alert', severity: overdueReceivable > currentBalance * 0.2 ? 'high' : 'medium',
        title: 'Inadimplência detectada',
        description: `R$ ${overdueReceivable.toFixed(2)} em recebíveis vencidos. Acione cobrança imediatamente.`,
        metric: 'overdue_receivable', value: overdueReceivable,
      });
    }
    if (expenseGrowth > 20) {
      insights.push({
        type: 'alert', severity: 'high',
        title: 'Despesas cresceram acima do esperado',
        description: `Aumento de ${expenseGrowth.toFixed(1)}% nas saídas vs período anterior. Revise contratos e gastos recorrentes.`,
        metric: 'expense_growth', value: expenseGrowth,
      });
    }
    if (overduePayable > 0) {
      insights.push({
        type: 'alert', severity: 'medium',
        title: 'Contas a pagar vencidas',
        description: `R$ ${overduePayable.toFixed(2)} em débitos atrasados. Risco de juros e multas.`,
        metric: 'overdue_payable', value: overduePayable,
      });
    }
    if (netCashFlow30d > 0 && projectedBalance30d > currentBalance) {
      insights.push({
        type: 'opportunity', severity: 'low',
        title: 'Fluxo de caixa positivo',
        description: 'Considere aplicação financeira ou amortização de dívidas para melhorar margem.',
      });
    }
    if (insights.length === 0) {
      insights.push({
        type: 'recommendation', severity: 'low',
        title: 'Saúde financeira estável',
        description: 'Nenhum risco crítico detectado nos últimos 30 dias. Continue monitorando.',
      });
    }

    return new Response(JSON.stringify({
      score,
      scoreGrade,
      metrics: {
        currentBalance, inflow30d, outflow30d, netCashFlow30d,
        overdueReceivable, overduePayable,
        projectedBalance30d, projectedBalance60d, projectedBalance90d,
        expenseGrowth,
      },
      insights,
      computedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('financial-insights error', error);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

};

Deno.serve(instrument(handler, { source: "financial-insights", getContext: contextFromAuth }));
