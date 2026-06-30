// WMS Intelligence Engine v1
// Deterministic rule pack that generates wms_recommendations for tenants.
// Triggered by cron or manual invoke.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Rec {
  type: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  body?: string;
  evidence?: Record<string, unknown>;
  suggested_action?: Record<string, unknown>;
  target_entity?: string;
  target_id?: string | null;
  expires_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    let companyIds: string[] = [];
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body?.company_id) companyIds = [body.company_id];
    }

    if (companyIds.length === 0) {
      const { data } = await admin.from("companies").select("id");
      companyIds = (data ?? []).map((c: any) => c.id);
    }

    const summary: Record<string, number> = {};
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    for (const companyId of companyIds) {
      const recs: Rec[] = [];

      // Rule 1: Hot zone — occupancy > 90%
      const { data: zones } = await admin
        .from("v_wms_kpi_occupancy")
        .select("zone, occupied, capacity, occupancy_pct")
        .eq("company_id", companyId);
      for (const z of zones ?? []) {
        if ((z.occupancy_pct ?? 0) > 90) {
          recs.push({
            type: "hot_zone",
            severity: (z.occupancy_pct ?? 0) > 97 ? "high" : "medium",
            title: `Zona ${z.zone} com ocupação crítica (${Number(z.occupancy_pct).toFixed(1)}%)`,
            body: "Risco de congestionamento e perda de produtividade no picking.",
            evidence: { zone: z.zone, occupied: z.occupied, capacity: z.capacity, pct: z.occupancy_pct },
            suggested_action: { action: "rebalance_zone", zone: z.zone },
            target_entity: "zone",
            expires_at: expires,
          });
        }
      }

      // Rule 2: Congestion — locations with > 20 movements in last hour
      const { data: congestion } = await admin.rpc("noop_skip" as any).catch(() => ({ data: null }));
      if (!congestion) {
        const { data: hot } = await admin
          .from("wms_movements")
          .select("to_location, created_at")
          .eq("company_id", companyId)
          .gte("created_at", new Date(Date.now() - 3600000).toISOString())
          .not("to_location", "is", null);
        const counts: Record<string, number> = {};
        for (const m of hot ?? []) counts[m.to_location as string] = (counts[m.to_location as string] ?? 0) + 1;
        for (const [loc, n] of Object.entries(counts)) {
          if (n > 20) {
            recs.push({
              type: "congestion",
              severity: n > 50 ? "high" : "medium",
              title: `Endereço ${loc} congestionado (${n} movimentos/h)`,
              body: "Considere redistribuir tarefas ou abrir endereço auxiliar.",
              evidence: { location: loc, moves_last_hour: n },
              suggested_action: { action: "redistribute", location: loc },
              target_entity: "location",
              expires_at: expires,
            });
          }
        }
      }

      // Rule 3: Cold SKU em zona nobre (classe C em abc_class A)
      const { data: coldInNoble } = await admin
        .from("stock_balances")
        .select("product_id, location_id, wms_storage_locations!inner(abc_class, code), products!inner(abc_class, name, code)")
        .eq("company_id", companyId)
        .eq("wms_storage_locations.abc_class", "A")
        .eq("products.abc_class", "C")
        .limit(20);
      for (const row of (coldInNoble ?? []) as any[]) {
        recs.push({
          type: "cold_sku_noble_zone",
          severity: "low",
          title: `SKU ${row.products?.code} (classe C) em endereço nobre ${row.wms_storage_locations?.code}`,
          body: "Liberar endereço A para SKU de alto giro.",
          evidence: { product: row.products?.code, location: row.wms_storage_locations?.code },
          suggested_action: { action: "relocate_to_zone", target_zone: "C", product_id: row.product_id },
          target_entity: "product",
          target_id: row.product_id,
          expires_at: expires,
        });
      }

      // Rule 4: FEFO em risco — lotes com vencimento em < 30 dias e qty > 0
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const { data: fefo } = await admin
        .from("stock_lots")
        .select("id, lot_number, product_id, expiry_date, quantity")
        .eq("company_id", companyId)
        .gt("quantity", 0)
        .lte("expiry_date", in30)
        .order("expiry_date", { ascending: true })
        .limit(20);
      for (const l of (fefo ?? []) as any[]) {
        const days = Math.max(0, Math.ceil((new Date(l.expiry_date).getTime() - Date.now()) / 86400000));
        recs.push({
          type: "fefo_risk",
          severity: days < 7 ? "critical" : days < 15 ? "high" : "medium",
          title: `Lote ${l.lot_number} vence em ${days} dias`,
          body: "Priorizar em ondas de separação ou ação comercial.",
          evidence: { lot_id: l.id, expiry: l.expiry_date, quantity: l.quantity, days_to_expiry: days },
          suggested_action: { action: "prioritize_picking", lot_id: l.id },
          target_entity: "lot",
          target_id: l.id,
          expires_at: expires,
        });
      }

      // Rule 5: Dock balance — docks com fila > 5 enquanto outras vazias
      const { data: docks } = await admin
        .from("loading_docks")
        .select("id, code, status, queue_size")
        .eq("company_id", companyId);
      const sized = (docks ?? []).map((d: any) => d.queue_size ?? 0);
      const max = Math.max(0, ...sized);
      const min = Math.min(...sized, 0);
      if (max - min > 5) {
        recs.push({
          type: "dock_imbalance",
          severity: "medium",
          title: `Docas desbalanceadas (diferença ${max - min} entre maior e menor fila)`,
          body: "Realocar veículos ou reabrir doca ociosa.",
          evidence: { max_queue: max, min_queue: min, docks: docks?.length ?? 0 },
          suggested_action: { action: "rebalance_docks" },
          target_entity: "dock",
          expires_at: expires,
        });
      }

      // Upsert by (company_id, type, target_entity, target_id) using delete-then-insert for opens
      if (recs.length > 0) {
        // Mark previous open recs of same type as expired before inserting fresh
        const types = [...new Set(recs.map((r) => r.type))];
        await admin
          .from("wms_recommendations")
          .update({ status: "expired" })
          .eq("company_id", companyId)
          .eq("status", "open")
          .in("type", types);

        const rows = recs.map((r) => ({ ...r, company_id: companyId, status: "open" }));
        const { error } = await admin.from("wms_recommendations").insert(rows);
        if (error) console.error("[wms-intelligence] insert error", error);
      }

      summary[companyId] = recs.length;

      // Emit event
      await admin.from("wms_events").insert({
        company_id: companyId,
        event_type: "intelligence.run",
        source_module: "wms",
        entity_type: "engine",
        payload: { generated: recs.length },
      });
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[wms-intelligence] fatal", e);
    return new Response(JSON.stringify({ ok: false, error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
