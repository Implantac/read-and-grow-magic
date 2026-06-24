import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/require-auth.ts";
import { corsHeaders, jsonResponse, safeError } from "../_shared/tenant.ts";

interface ReportData {
  report_date: string;
  receivables_due_today: { count: number; total: number; items: any[] };
  receivables_overdue: { count: number; total: number; items: any[] };
  payables_due_today: { count: number; total: number; items: any[] };
  payables_overdue: { count: number; total: number; items: any[] };
  sales_summary: { count: number; total: number; items: any[] };
  cash_flow: { income: number; expense: number; balance: number; entries: any[] };
  generated_at: string;
}

async function buildReportForCompany(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  today: string,
): Promise<ReportData> {
  const { data: recDueToday } = await supabase
    .from("accounts_receivable")
    .select("id, description, client_name, amount, due_date, status")
    .eq("company_id", companyId)
    .eq("due_date", today)
    .eq("status", "pending");

  const { data: recOverdue } = await supabase
    .from("accounts_receivable")
    .select("id, description, client_name, amount, due_date, status")
    .eq("company_id", companyId)
    .lt("due_date", today)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(50);

  const { data: payDueToday } = await supabase
    .from("accounts_payable")
    .select("id, description, supplier, amount, due_date, status")
    .eq("company_id", companyId)
    .eq("due_date", today)
    .eq("status", "pending");

  const { data: payOverdue } = await supabase
    .from("accounts_payable")
    .select("id, description, supplier, amount, due_date, status")
    .eq("company_id", companyId)
    .lt("due_date", today)
    .eq("status", "pending")
    .order("due_date", { ascending: true })
    .limit(50);

  const { data: salesToday } = await supabase
    .from("sales")
    .select("id, number, client_name, total, status")
    .eq("company_id", companyId)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`);

  const { data: cashEntries } = await supabase
    .from("cash_flow_entries")
    .select("id, description, type, amount, balance, category")
    .eq("company_id", companyId)
    .eq("date", today);

  const sum = (rows: any[] | null) =>
    (rows ?? []).reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const cashFlow = cashEntries || [];
  const cashIncome = cashFlow
    .filter((e: any) => e.type === "income")
    .reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const cashExpense = cashFlow
    .filter((e: any) => e.type === "expense")
    .reduce((s: number, e: any) => s + Math.abs(e.amount || 0), 0);
  const lastBalance = cashFlow.length > 0 ? cashFlow[cashFlow.length - 1].balance : 0;

  return {
    report_date: today,
    receivables_due_today: {
      count: recDueToday?.length || 0,
      total: sum(recDueToday),
      items: recDueToday || [],
    },
    receivables_overdue: {
      count: recOverdue?.length || 0,
      total: sum(recOverdue),
      items: recOverdue || [],
    },
    payables_due_today: {
      count: payDueToday?.length || 0,
      total: sum(payDueToday),
      items: payDueToday || [],
    },
    payables_overdue: {
      count: payOverdue?.length || 0,
      total: sum(payOverdue),
      items: payOverdue || [],
    },
    sales_summary: {
      count: salesToday?.length || 0,
      total: (salesToday ?? []).reduce((s: number, x: any) => s + (x.total || 0), 0),
      items: salesToday || [],
    },
    cash_flow: {
      income: cashIncome,
      expense: cashExpense,
      balance: lastBalance,
      entries: cashFlow,
    },
    generated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireAuth(req, { roles: ["admin", "manager"], allowCron: true });
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().split("T")[0];

    let companyIds: string[] = [];
    if (auth.viaCron) {
      const { data: companies } = await supabase.from("companies").select("id");
      companyIds = (companies ?? []).map((c: any) => c.id);
    } else {
      if (!auth.companyId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      companyIds = [auth.companyId];
    }

    const reports: Array<{ company_id: string; report: ReportData }> = [];
    for (const companyId of companyIds) {
      const report = await buildReportForCompany(supabase, companyId, today);
      await supabase.from("daily_executive_reports").insert({
        company_id: companyId,
        report_date: today,
        report_data: report,
        generated_by: auth.viaCron ? "system" : (auth.userId ?? "system"),
      });
      reports.push({ company_id: companyId, report });
    }

    return jsonResponse({
      success: true,
      companies: companyIds.length,
      reports: auth.viaCron ? reports.length : reports[0]?.report,
    });
  } catch (error) {
    return safeError(error, "daily-executive-report");
  }
});
