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

      // ============================================================
      // ML-STYLE PREDICTIVE RULES (v2 — Sprint 9 Intelligence)
      // Statistical heuristics over wms_movements / stock_balances.
      // Each rule is wrapped in try/catch so a single failure does not
      // abort the whole engine run.
      // ============================================================

      // Rule 6: Demand surge — outbound last 7d > 1.5x prior 7d (per product)
      try {
        const now = Date.now();
        const d7 = new Date(now - 7 * 86400000).toISOString();
        const d14 = new Date(now - 14 * 86400000).toISOString();
        const { data: outMoves } = await admin
          .from("wms_movements")
          .select("product_id, quantity, created_at, movement_type")
          .eq("company_id", companyId)
          .gte("created_at", d14)
          .in("movement_type", ["outbound", "picking", "shipment"])
          .limit(20000);
        const last7: Record<string, number> = {};
        const prior7: Record<string, number> = {};
        for (const m of (outMoves ?? []) as Array<{ product_id: string | null; quantity: number | null; created_at: string }>) {
          if (!m.product_id) continue;
          const ts = new Date(m.created_at).getTime();
          const q = Number(m.quantity ?? 0);
          if (ts >= new Date(d7).getTime()) last7[m.product_id] = (last7[m.product_id] ?? 0) + q;
          else prior7[m.product_id] = (prior7[m.product_id] ?? 0) + q;
        }
        const surges: Array<{ pid: string; recent: number; prev: number; ratio: number }> = [];
        for (const [pid, recent] of Object.entries(last7)) {
          const prev = prior7[pid] ?? 0;
          if (prev >= 5 && recent / Math.max(1, prev) >= 1.5) {
            surges.push({ pid, recent, prev, ratio: recent / Math.max(1, prev) });
          }
        }
        surges.sort((a, b) => b.ratio - a.ratio);
        for (const s of surges.slice(0, 10)) {
          const { data: prod } = await admin
            .from("products")
            .select("code, name")
            .eq("id", s.pid)
            .maybeSingle();
          recs.push({
            type: "demand_surge",
            severity: s.ratio >= 3 ? "high" : "medium",
            title: `SKU ${prod?.code ?? s.pid.slice(0, 8)} com alta de demanda (+${Math.round((s.ratio - 1) * 100)}%)`,
            body: "Adiantar reposição e considerar realocar para zona A para reduzir deslocamento.",
            evidence: { product_id: s.pid, last_7d: s.recent, prior_7d: s.prev, ratio: Number(s.ratio.toFixed(2)) },
            suggested_action: { action: "increase_replenishment", product_id: s.pid },
            target_entity: "product",
            target_id: s.pid,
            expires_at: expires,
          });
        }
      } catch (e) {
        console.error("[wms-intelligence] demand_surge failed", e);
      }

      // Rule 7: Predicted stockout — days_of_cover < 5 with avg daily consumption > 0
      try {
        const d30 = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: consumption } = await admin
          .from("wms_movements")
          .select("product_id, quantity")
          .eq("company_id", companyId)
          .gte("created_at", d30)
          .in("movement_type", ["outbound", "picking", "shipment"])
          .limit(50000);
        const daily: Record<string, number> = {};
        for (const m of (consumption ?? []) as Array<{ product_id: string | null; quantity: number | null }>) {
          if (!m.product_id) continue;
          daily[m.product_id] = (daily[m.product_id] ?? 0) + Number(m.quantity ?? 0) / 30;
        }
        const productIds = Object.keys(daily).filter((id) => daily[id] > 0);
        if (productIds.length > 0) {
          const { data: balances } = await admin
            .from("stock_balances")
            .select("product_id, quantity, reserved_qty")
            .eq("company_id", companyId)
            .in("product_id", productIds.slice(0, 500));
          const totals: Record<string, number> = {};
          for (const b of (balances ?? []) as Array<{ product_id: string; quantity: number | null; reserved_qty: number | null }>) {
            totals[b.product_id] = (totals[b.product_id] ?? 0) + Math.max(0, Number(b.quantity ?? 0) - Number(b.reserved_qty ?? 0));
          }
          const risks: Array<{ pid: string; days: number; avg: number; qty: number }> = [];
          for (const pid of productIds) {
            const qty = totals[pid] ?? 0;
            const avg = daily[pid];
            const days = qty / avg;
            if (days < 5) risks.push({ pid, days, avg, qty });
          }
          risks.sort((a, b) => a.days - b.days);
          for (const r of risks.slice(0, 15)) {
            const { data: prod } = await admin.from("products").select("code, name").eq("id", r.pid).maybeSingle();
            recs.push({
              type: "predicted_stockout",
              severity: r.days < 1 ? "critical" : r.days < 3 ? "high" : "medium",
              title: `SKU ${prod?.code ?? r.pid.slice(0, 8)} sem cobertura (${r.days.toFixed(1)}d restantes)`,
              body: "Gerar pedido de compra ou produção para evitar ruptura.",
              evidence: {
                product_id: r.pid,
                days_of_cover: Number(r.days.toFixed(2)),
                available_qty: Number(r.qty.toFixed(2)),
                avg_daily_consumption: Number(r.avg.toFixed(2)),
              },
              suggested_action: { action: "create_purchase_order", product_id: r.pid },
              target_entity: "product",
              target_id: r.pid,
              expires_at: expires,
            });
          }
        }
      } catch (e) {
        console.error("[wms-intelligence] predicted_stockout failed", e);
      }

      // Rule 8: Picking time anomaly — picking_tasks duration last 24h vs prior 7d (z-score > 2)
      try {
        const d1 = new Date(Date.now() - 86400000).toISOString();
        const d8 = new Date(Date.now() - 8 * 86400000).toISOString();
        const { data: tasks } = await admin
          .from("picking_tasks")
          .select("operator_id, started_at, completed_at, status")
          .eq("company_id", companyId)
          .eq("status", "completed")
          .gte("started_at", d8)
          .not("completed_at", "is", null)
          .limit(5000);
        const baseline: number[] = [];
        const recent: Array<{ op: string; dur: number }> = [];
        for (const t of (tasks ?? []) as Array<{ operator_id: string | null; started_at: string; completed_at: string }>) {
          const dur = (new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000;
          if (dur <= 0 || dur > 480) continue;
          if (new Date(t.started_at).toISOString() >= d1) {
            if (t.operator_id) recent.push({ op: t.operator_id, dur });
          } else {
            baseline.push(dur);
          }
        }
        if (baseline.length >= 20 && recent.length >= 5) {
          const mean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
          const variance = baseline.reduce((a, b) => a + (b - mean) ** 2, 0) / baseline.length;
          const std = Math.sqrt(variance) || 1;
          const byOp: Record<string, number[]> = {};
          for (const r of recent) (byOp[r.op] ||= []).push(r.dur);
          for (const [op, arr] of Object.entries(byOp)) {
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            const z = (avg - mean) / std;
            if (z >= 2 && arr.length >= 3) {
              recs.push({
                type: "picking_anomaly",
                severity: z >= 3.5 ? "high" : "medium",
                title: `Operador com tempo de picking ${(avg / mean).toFixed(1)}x acima da média (z=${z.toFixed(1)})`,
                body: "Verificar treinamento, layout do trajeto ou ergonomia do endereço.",
                evidence: {
                  operator_id: op,
                  avg_minutes_last_24h: Number(avg.toFixed(1)),
                  baseline_avg: Number(mean.toFixed(1)),
                  z_score: Number(z.toFixed(2)),
                  tasks_sampled: arr.length,
                },
                suggested_action: { action: "review_operator", operator_id: op },
                target_entity: "operator",
                target_id: op,
                expires_at: expires,
              });
            }
          }
        }
      } catch (e) {
        console.error("[wms-intelligence] picking_anomaly failed", e);
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
