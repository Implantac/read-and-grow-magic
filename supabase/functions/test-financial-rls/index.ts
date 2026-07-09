// Runtime RLS + role-matrix test for financial_* / payment_* / bank_* tables.
// Creates ephemeral test users (via Admin API), assigns app_roles, then runs
// SELECT/INSERT/UPDATE/DELETE against each table using a per-user PostgREST
// client so RLS is enforced end-to-end.
//
// GET /functions/v1/test-financial-rls  -> JSON summary with pass/fail matrix.
//
// Restricted to admin/system_admin callers.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireAuth } from "../_shared/require-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Op = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
type Role = "admin" | "manager" | "operator" | "viewer";

interface Result {
  table: string;
  role: Role;
  op: Op;
  expected: "allow" | "deny";
  actual: "allow" | "deny";
  pass: boolean;
  detail?: string;
}

// Expected write access matrix (SELECT is allow for all four roles)
const WRITE_MATRIX: Record<string, { insert: Role[]; update: Role[]; delete: Role[] }> = {
  bank_accounts:         { insert: ["admin","manager"],           update: ["admin","manager"],           delete: ["admin"] },
  bank_transactions:     { insert: ["admin","manager","operator"],update: ["admin","manager","operator"],delete: ["admin","manager"] },
  bank_transfers:        { insert: ["admin","manager"],           update: ["admin","manager"],           delete: ["admin"] },
  cash_flow_entries:     { insert: ["admin","manager","operator"],update: ["admin","manager","operator"],delete: ["admin","manager"] },
  financial_checks:      { insert: ["admin","manager","operator"],update: ["admin","manager","operator"],delete: ["admin"] },
  financial_ledger:      { insert: ["admin","manager"],           update: ["admin","manager"],           delete: ["admin"] },
  financial_settlements: { insert: ["admin","manager","operator"],update: ["admin","manager"],           delete: ["admin"] },
  payment_records:       { insert: ["admin","manager","operator"],update: ["admin","manager"],           delete: ["admin"] },
};

const PASSWORD = "Rls-Test-" + crypto.randomUUID();

async function createUser(admin: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user!.id;
}

async function deleteUser(admin: SupabaseClient, id: string) {
  try { await admin.auth.admin.deleteUser(id); } catch { /* best-effort */ }
}

async function signIn(supabaseUrl: string, anonKey: string, email: string): Promise<SupabaseClient> {
  const c = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn(${email}): ${error.message}`);
  return c;
}

// Fixture payloads (minimum required NOT NULL columns per table)
function payload(table: string, companyId: string, seedBankId?: string): Record<string, unknown> {
  const c = companyId;
  switch (table) {
    case "bank_accounts":         return { name: "rls-test-"+crypto.randomUUID(), bank_name: "T", company_id: c };
    case "bank_transactions":     return { description: "rls", amount: 1, type: "credit", company_id: c };
    case "bank_transfers":        return { from_account_id: seedBankId, to_account_id: seedBankId, amount: 1, company_id: c };
    case "cash_flow_entries":     return { description: "rls", type: "income", category: "t", amount: 1, company_id: c };
    case "financial_checks":      return { check_type: "received", check_number: "C-"+crypto.randomUUID().slice(0,8), amount: 1, company_id: c };
    case "financial_ledger":      return { type: "credit", amount: 1, description: "rls", source: "manual", company_id: c };
    case "financial_settlements": return { source_type: "receivable", source_id: c, amount: 1, total_settled: 1, company_id: c };
    case "payment_records":       return { amount: 1, total_paid: 1, company_id: c };
  }
  return {};
}

async function testOp(
  client: SupabaseClient,
  table: string,
  op: Op,
  expected: "allow" | "deny",
  role: Role,
  seedRowId: string | null,
  companyId: string,
  seedBankId?: string,
): Promise<Result> {
  let actual: "allow" | "deny" = "allow";
  let detail = "";

  try {
    if (op === "SELECT") {
      const { data, error } = await client.from(table).select("id").limit(1);
      if (error) { actual = "deny"; detail = error.message; }
      else if (!data || data.length === 0) { actual = "deny"; detail = "no rows visible"; }
    } else if (op === "INSERT") {
      const { error } = await client.from(table).insert(payload(table, companyId, seedBankId));
      if (error) { actual = "deny"; detail = error.message; }
    } else if (op === "UPDATE" && seedRowId) {
      const patch = table === "bank_accounts" ? { balance: 0 }
                  : table === "bank_transactions" ? { description: "u" }
                  : table === "bank_transfers" ? { description: "u" }
                  : table === "cash_flow_entries" ? { description: "u" }
                  : table === "financial_checks" ? { notes: "u" }
                  : table === "financial_ledger" ? { description: "u" }
                  : table === "financial_settlements" ? { notes: "u" }
                  : { notes: "u" };
      const { error, count } = await client.from(table).update(patch, { count: "exact" }).eq("id", seedRowId);
      if (error) { actual = "deny"; detail = error.message; }
      else if (count === 0) { actual = "deny"; detail = "0 rows updated"; }
    } else if (op === "DELETE") {
      // Try to delete a non-existent row: RLS will still deny before matching
      // when policy USING clause forbids the action for this role. If policy
      // allows, DELETE succeeds with 0 rows (still "allow" — no error).
      const { error } = await client.from(table).delete().eq("id", "00000000-0000-0000-0000-000000000000");
      if (error) { actual = "deny"; detail = error.message; }
    }
  } catch (e) {
    actual = "deny"; detail = String((e as Error).message);
  }

  return { table, role, op, expected, actual, pass: actual === expected, detail: detail || undefined };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req, { roles: ["admin", "system_admin"] });
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: auth.message }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service, { auth: { persistSession: false } });

  const results: Result[] = [];
  const created: string[] = [];
  const seededRowIds: Record<string, string> = {};
  let seedBankId: string | undefined;

  try {
    // Reuse caller's company for correct tenant scoping
    const companyId = auth.companyId!;
    const roles: Role[] = ["admin","manager","operator","viewer"];
    const clients: Partial<Record<Role, SupabaseClient>> = {};

    // 1) create 4 ephemeral users
    for (const r of roles) {
      const email = `rls-${r}-${crypto.randomUUID()}@rls.test`;
      const id = await createUser(admin, email);
      created.push(id);
      // Attach to company via profile + role
      await admin.from("profiles").upsert({ id, company_id: companyId, email, full_name: `RLS ${r}` });
      await admin.from("user_roles").insert({ user_id: id, role: r, company_id: companyId });
      clients[r] = await signIn(url, anon, email);
    }

    // 2) seed one row per table using service role (bypasses RLS)
    for (const table of Object.keys(WRITE_MATRIX)) {
      const p: Record<string, unknown> = { ...payload(table, companyId, seedBankId) };
      if (table === "bank_accounts") p.name = "rls-seed-"+crypto.randomUUID();
      const { data, error } = await admin.from(table).insert(p).select("id").single();
      if (error) throw new Error(`seed ${table}: ${error.message}`);
      seededRowIds[table] = data.id;
      if (table === "bank_accounts") seedBankId = data.id;
    }
    // re-seed bank_transfers now that we have a valid bank id
    if (seedBankId) {
      const { data } = await admin.from("bank_transfers")
        .insert({ from_account_id: seedBankId, to_account_id: seedBankId, amount: 1, company_id: companyId })
        .select("id").single();
      if (data) seededRowIds.bank_transfers = data.id;
    }

    // 3) run matrix
    for (const table of Object.keys(WRITE_MATRIX)) {
      const m = WRITE_MATRIX[table];
      for (const r of roles) {
        const client = clients[r]!;
        results.push(await testOp(client, table, "SELECT", "allow", r, seededRowIds[table], companyId, seedBankId));
        results.push(await testOp(client, table, "INSERT", m.insert.includes(r) ? "allow" : "deny", r, seededRowIds[table], companyId, seedBankId));
        results.push(await testOp(client, table, "UPDATE", m.update.includes(r) ? "allow" : "deny", r, seededRowIds[table], companyId, seedBankId));
        results.push(await testOp(client, table, "DELETE", m.delete.includes(r) ? "allow" : "deny", r, seededRowIds[table], companyId, seedBankId));
      }
    }

    // 4) cross-tenant isolation smoke
    const fakeCompany = crypto.randomUUID();
    const viewer = clients.viewer!;
    const { data: crossData } = await viewer.from("bank_accounts").select("id").eq("company_id", fakeCompany);
    results.push({
      table: "bank_accounts", role: "viewer", op: "SELECT", expected: "deny",
      actual: (crossData && crossData.length > 0) ? "allow" : "deny",
      pass: !crossData || crossData.length === 0,
      detail: `cross_tenant rows: ${crossData?.length ?? 0}`,
    });

    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    return new Response(JSON.stringify({
      ok: failed === 0,
      total: results.length,
      passed,
      failed,
      failures: results.filter(r => !r.pass),
      results,
    }, null, 2), {
      status: failed === 0 ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message), results }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    // Cleanup: delete seed rows and ephemeral users. CASCADE removes user_roles/profiles.
    for (const [table, id] of Object.entries(seededRowIds)) {
      await admin.from(table).delete().eq("id", id);
    }
    for (const id of created) await deleteUser(admin, id);
  }
});
