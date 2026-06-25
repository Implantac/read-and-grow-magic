// Resolves dashboard widget data from a whitelisted catalog of sources.
// Multi-tenant: scopes every query to ctx.companyId / branchScope.
// Returns { type: 'scalar'|'series'|'pie'|'table', data, meta? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth } from "../_shared/require-auth.ts";
import { resolveContext, branchScope, jsonError, jsonResponse, safeError } from "../_shared/tenant.ts";

type Source = {
  type: "scalar" | "series" | "pie" | "table";
  run: (admin: any, companyId: string, branches: string[] | null, cfg: any) => Promise<any>;
};

const SOURCES: Record<string, Source> = {
  "sales.total_month": {
    type: "scalar",
    async run(admin, companyId) {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
      const { data, error } = await admin
        .from("sales").select("total_amount")
        .eq("company_id", companyId).gte("created_at", start.toISOString());
      if (error) throw error;
      const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
      return { value: total, format: "currency" };
    },
  },
  "orders.count_open": {
    type: "scalar",
    async run(admin, companyId, branches) {
      let q = admin.from("orders").select("id", { count: "exact", head: true })
        .eq("company_id", companyId).not("status", "in", "(completed,cancelled,delivered)");
      if (branches) q = q.in("branch_id", branches);
      const { count, error } = await q;
      if (error) throw error;
      return { value: count ?? 0 };
    },
  },
  "accounts_receivable.open_total": {
    type: "scalar",
    async run(admin, companyId) {
      const { data, error } = await admin
        .from("accounts_receivable").select("amount,paid_amount")
        .eq("company_id", companyId).neq("status", "paid");
      if (error) throw error;
      const total = (data ?? []).reduce(
        (s: number, r: any) => s + (Number(r.amount || 0) - Number(r.paid_amount || 0)), 0,
      );
      return { value: total, format: "currency" };
    },
  },
  "accounts_payable.open_total": {
    type: "scalar",
    async run(admin, companyId) {
      const { data, error } = await admin
        .from("accounts_payable").select("amount,paid_amount")
        .eq("company_id", companyId).neq("status", "paid");
      if (error) throw error;
      const total = (data ?? []).reduce(
        (s: number, r: any) => s + (Number(r.amount || 0) - Number(r.paid_amount || 0)), 0,
      );
      return { value: total, format: "currency" };
    },
  },
  "sales.timeseries_30d": {
    type: "series",
    async run(admin, companyId) {
      const start = new Date(); start.setDate(start.getDate() - 30);
      const { data, error } = await admin
        .from("sales").select("created_at,total_amount")
        .eq("company_id", companyId).gte("created_at", start.toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      const buckets: Record<string, number> = {};
      for (const r of data ?? []) {
        const k = String(r.created_at).slice(0, 10);
        buckets[k] = (buckets[k] || 0) + Number(r.total_amount || 0);
      }
      return Object.entries(buckets).map(([date, value]) => ({ date, value }));
    },
  },
  "orders.by_status": {
    type: "pie",
    async run(admin, companyId, branches) {
      let q = admin.from("orders").select("status").eq("company_id", companyId);
      if (branches) q = q.in("branch_id", branches);
      const { data, error } = await q;
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) counts[r.status || "unknown"] = (counts[r.status || "unknown"] || 0) + 1;
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  },
  "production_orders.by_status": {
    type: "pie",
    async run(admin, companyId, branches) {
      let q = admin.from("production_orders").select("status").eq("company_id", companyId);
      if (branches) q = q.in("branch_id", branches);
      const { data, error } = await q;
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) counts[r.status || "unknown"] = (counts[r.status || "unknown"] || 0) + 1;
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  },
  "financial_ledger.timeseries_30d": {
    type: "series",
    async run(admin, companyId) {
      const start = new Date(); start.setDate(start.getDate() - 30);
      const { data, error } = await admin
        .from("financial_ledger").select("entry_date,amount,direction")
        .eq("company_id", companyId).gte("entry_date", start.toISOString().slice(0, 10))
        .order("entry_date", { ascending: true });
      if (error) throw error;
      const buckets: Record<string, number> = {};
      for (const r of data ?? []) {
        const sign = r.direction === "credit" ? 1 : -1;
        const k = String(r.entry_date).slice(0, 10);
        buckets[k] = (buckets[k] || 0) + sign * Number(r.amount || 0);
      }
      return Object.entries(buckets).map(([date, value]) => ({ date, value }));
    },
  },
  "inventory.low_stock": {
    type: "table",
    async run(admin, companyId, _b, cfg) {
      const limit = Math.min(Number(cfg?.limit ?? 10), 50);
      const { data, error } = await admin
        .from("products").select("sku,name,stock_quantity,min_stock")
        .eq("company_id", companyId).order("stock_quantity", { ascending: true }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return jsonError(auth.message, auth.status);
    const ctx = await resolveContext(req, auth);
    if (!ctx.ok) return jsonError(ctx.message, ctx.status);
    if (!ctx.companyId) return jsonError("Forbidden", 403);

    const body = await req.json().catch(() => ({}));
    const dataSource: string = body?.data_source ?? "";
    const cfg = body?.config ?? {};

    if (dataSource === "__catalog__") {
      return jsonResponse({
        sources: Object.entries(SOURCES).map(([key, s]) => ({ key, type: s.type })),
      });
    }

    const src = SOURCES[dataSource];
    if (!src) return jsonError(`Fonte desconhecida: ${dataSource}`, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const branches = branchScope(ctx);
    const data = await src.run(admin, ctx.companyId, branches, cfg);
    return jsonResponse({ type: src.type, data });
  } catch (e) {
    return safeError(e, "dashboard-widget-data");
  }
});
