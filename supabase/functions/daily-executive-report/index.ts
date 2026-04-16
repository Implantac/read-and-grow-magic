import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    // 1. Accounts Receivable - Due Today
    const { data: recDueToday } = await supabase
      .from("accounts_receivable")
      .select("id, description, client_name, amount, due_date, status")
      .eq("due_date", today)
      .eq("status", "pending");

    const receivablesDueToday = recDueToday || [];
    const receivablesTodayTotal = receivablesDueToday.reduce(
      (sum: number, r: any) => sum + (r.amount || 0), 0
    );

    // 2. Accounts Receivable - Overdue
    const { data: recOverdue } = await supabase
      .from("accounts_receivable")
      .select("id, description, client_name, amount, due_date, status")
      .lt("due_date", today)
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(50);

    const receivablesOverdue = recOverdue || [];
    const receivablesOverdueTotal = receivablesOverdue.reduce(
      (sum: number, r: any) => sum + (r.amount || 0), 0
    );

    // 3. Accounts Payable - Due Today
    const { data: payDueToday } = await supabase
      .from("accounts_payable")
      .select("id, description, supplier, amount, due_date, status")
      .eq("due_date", today)
      .eq("status", "pending");

    const payablesDueToday = payDueToday || [];
    const payablesTodayTotal = payablesDueToday.reduce(
      (sum: number, r: any) => sum + (r.amount || 0), 0
    );

    // 4. Accounts Payable - Overdue
    const { data: payOverdue } = await supabase
      .from("accounts_payable")
      .select("id, description, supplier, amount, due_date, status")
      .lt("due_date", today)
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(50);

    const payablesOverdue = payOverdue || [];
    const payablesOverdueTotal = payablesOverdue.reduce(
      (sum: number, r: any) => sum + (r.amount || 0), 0
    );

    // 5. Sales Summary - Today
    const { data: salesToday } = await supabase
      .from("sales")
      .select("id, number, client_name, total, status")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    const sales = salesToday || [];
    const salesTotalValue = sales.reduce(
      (sum: number, s: any) => sum + (s.total || 0), 0
    );

    // 6. Cash Flow - Today
    const { data: cashEntries } = await supabase
      .from("cash_flow_entries")
      .select("id, description, type, amount, balance, category")
      .eq("date", today);

    const cashFlow = cashEntries || [];
    const cashIncome = cashFlow
      .filter((e: any) => e.type === "income")
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const cashExpense = cashFlow
      .filter((e: any) => e.type === "expense")
      .reduce((sum: number, e: any) => sum + Math.abs(e.amount || 0), 0);
    const lastBalance = cashFlow.length > 0
      ? cashFlow[cashFlow.length - 1].balance
      : 0;

    const reportData: ReportData = {
      report_date: today,
      receivables_due_today: {
        count: receivablesDueToday.length,
        total: receivablesTodayTotal,
        items: receivablesDueToday,
      },
      receivables_overdue: {
        count: receivablesOverdue.length,
        total: receivablesOverdueTotal,
        items: receivablesOverdue,
      },
      payables_due_today: {
        count: payablesDueToday.length,
        total: payablesTodayTotal,
        items: payablesDueToday,
      },
      payables_overdue: {
        count: payablesOverdue.length,
        total: payablesOverdueTotal,
        items: payablesOverdue,
      },
      sales_summary: {
        count: sales.length,
        total: salesTotalValue,
        items: sales,
      },
      cash_flow: {
        income: cashIncome,
        expense: cashExpense,
        balance: lastBalance,
        entries: cashFlow,
      },
      generated_at: new Date().toISOString(),
    };

    // Save report
    const { error: insertError } = await supabase
      .from("daily_executive_reports")
      .insert({
        report_date: today,
        report_data: reportData,
        generated_by: "system",
      });

    if (insertError) {
      console.error("Error saving report:", insertError);
    }

    return new Response(JSON.stringify({ success: true, report: reportData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
