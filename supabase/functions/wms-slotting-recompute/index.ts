// WMS Slotting Engine — daily recompute
// Generates slotting_suggestions per company based on ABC, distance and capacity.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

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

    for (const companyId of companyIds) {
      // Pull top moving SKUs (last 90 days) — class A candidates
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const { data: moves } = await admin
        .from("wms_movements")
        .select("product_id, quantity")
        .eq("company_id", companyId)
        .gte("created_at", since)
        .not("product_id", "is", null);

      const byProduct: Record<string, number> = {};
      for (const m of moves ?? []) {
        byProduct[m.product_id as string] = (byProduct[m.product_id as string] ?? 0) + Number(m.quantity ?? 0);
      }
      const ranked = Object.entries(byProduct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50);

      if (ranked.length === 0) {
        summary[companyId] = 0;
        continue;
      }

      // Best class-A locations available (low pick_sequence, near dock)
      const { data: locs } = await admin
        .from("wms_storage_locations")
        .select("id, code, abc_class, occupied, capacity, distance_to_dock, pick_sequence, zone")
        .eq("company_id", companyId)
        .eq("active", true)
        .eq("abc_class", "A")
        .order("distance_to_dock", { ascending: true })
        .limit(100);

      const available = (locs ?? []).filter((l: any) => (l.capacity ?? 0) - (l.occupied ?? 0) > 0);

      // Current locations of those products
      const productIds = ranked.map(([id]) => id);
      const { data: balances } = await admin
        .from("stock_balances")
        .select("product_id, location_id, wms_storage_locations(code, abc_class, distance_to_dock)")
        .eq("company_id", companyId)
        .in("product_id", productIds);

      const currentLoc: Record<string, any> = {};
      for (const b of (balances ?? []) as any[]) {
        if (b.product_id && !currentLoc[b.product_id]) currentLoc[b.product_id] = b;
      }

      // Clear previous pending suggestions for this company
      await admin
        .from("slotting_suggestions")
        .update({ status: "expired" })
        .eq("company_id", companyId)
        .eq("status", "pending");

      const suggestions: any[] = [];
      let cursor = 0;
      for (const [productId, totalQty] of ranked) {
        const cur = currentLoc[productId];
        // Skip if already in an A location
        if (cur?.wms_storage_locations?.abc_class === "A") continue;
        const target = available[cursor++];
        if (!target) break;

        const curDist = Number(cur?.wms_storage_locations?.distance_to_dock ?? 100);
        const newDist = Number(target.distance_to_dock ?? 50);
        const picksPerDay = totalQty / 90;
        const distanceSaved = Math.max(0, curDist - newDist) * picksPerDay * 2;

        suggestions.push({
          company_id: companyId,
          product_id: productId,
          current_location_id: cur?.location_id ?? null,
          suggested_location_id: target.id,
          score: Math.round(distanceSaved * 10) / 10,
          abc_class: "A",
          reason: {
            rationale: "alto_giro_em_zona_baixa",
            total_qty_90d: totalQty,
            picks_per_day: Math.round(picksPerDay * 100) / 100,
            from_distance: curDist,
            to_distance: newDist,
          },
          estimated_distance_saved_m: Math.round(distanceSaved),
          estimated_picks_per_day: Math.round(picksPerDay * 100) / 100,
          status: "pending",
        });
      }

      if (suggestions.length > 0) {
        const { error } = await admin.from("slotting_suggestions").insert(suggestions);
        if (error) console.error("[wms-slotting] insert error", error);
      }
      summary[companyId] = suggestions.length;

      await admin.from("wms_events").insert({
        company_id: companyId,
        event_type: "slotting.recompute",
        source_module: "wms",
        entity_type: "engine",
        payload: { generated: suggestions.length },
      });
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[wms-slotting] fatal", e);
    return new Response(JSON.stringify({ ok: false, error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
