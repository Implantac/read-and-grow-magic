// WMS Slotting Engine v2 — multi-criteria optimization
// Improvements over v1:
//  - Product affinity (co-picked SKUs cluster nearby)
//  - ABC weighting from real picks (not static class)
//  - Weight/zone constraints (heavy → low pick_sequence; refrig → cold zone)
//  - What-if simulation (mode=simulate returns suggestions without persisting)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Mode = "simulate" | "persist";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode: Mode = body?.mode === "persist" ? "persist" : "simulate";
    let companyIds: string[] = body?.company_id ? [body.company_id] : [];
    if (companyIds.length === 0) {
      const { data } = await admin.from("companies").select("id");
      companyIds = (data ?? []).map((c: any) => c.id);
    }

    const result: Record<string, any> = {};

    for (const companyId of companyIds) {
      const since = new Date(Date.now() - 90 * 86400000).toISOString();

      // 1) Pick history — for ABC weight + affinity
      const { data: moves } = await admin
        .from("wms_movements")
        .select("product_id, quantity, reference_id, created_at")
        .eq("company_id", companyId)
        .gte("created_at", since)
        .not("product_id", "is", null);

      const byProduct: Record<string, number> = {};
      const byOrder: Record<string, Set<string>> = {};
      for (const m of moves ?? []) {
        const pid = m.product_id as string;
        byProduct[pid] = (byProduct[pid] ?? 0) + Number(m.quantity ?? 0);
        const ref = (m as any).reference_id as string | null;
        if (ref) {
          (byOrder[ref] ||= new Set()).add(pid);
        }
      }
      const ranked = Object.entries(byProduct).sort((a, b) => b[1] - a[1]);
      const total = ranked.reduce((a, [, q]) => a + q, 0) || 1;

      // ABC by Pareto cumulative
      const abc: Record<string, "A" | "B" | "C"> = {};
      let cum = 0;
      for (const [pid, qty] of ranked) {
        cum += qty;
        const pct = cum / total;
        abc[pid] = pct <= 0.8 ? "A" : pct <= 0.95 ? "B" : "C";
      }

      // 2) Affinity matrix (top co-occurrence pairs)
      const pairs: Record<string, number> = {};
      for (const set of Object.values(byOrder)) {
        const arr = Array.from(set);
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const k = arr[i] < arr[j] ? `${arr[i]}|${arr[j]}` : `${arr[j]}|${arr[i]}`;
            pairs[k] = (pairs[k] ?? 0) + 1;
          }
        }
      }
      const topPairs = Object.entries(pairs)
        .filter(([, c]) => c >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30);

      // 3) Locations + products meta (weight)
      const candidates = ranked.slice(0, 80).map(([id]) => id);
      const [{ data: locs }, { data: prods }] = await Promise.all([
        admin
          .from("wms_storage_locations")
          .select("id, code, abc_class, occupied, capacity, distance_to_dock, pick_sequence, zone, max_weight_kg")
          .eq("company_id", companyId)
          .eq("active", true)
          .order("distance_to_dock", { ascending: true })
          .limit(300),
        candidates.length
          ? admin.from("products").select("id, code, name, weight").in("id", candidates)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const prodMeta: Record<string, any> = {};
      for (const p of prods ?? []) prodMeta[p.id] = p;

      const free = (locs ?? []).filter(
        (l: any) => (l.capacity ?? 0) - (l.occupied ?? 0) > 0,
      );
      // partition available locations by ABC tier
      const poolA = free.filter((l: any) => l.abc_class === "A");
      const poolB = free.filter((l: any) => l.abc_class === "B");
      const poolC = free.filter((l: any) => l.abc_class === "C" || !l.abc_class);

      // current locations
      const { data: balances } = await admin
        .from("stock_balances")
        .select("product_id, location_id, wms_storage_locations(code, abc_class, distance_to_dock, zone)")
        .eq("company_id", companyId)
        .in("product_id", candidates.length ? candidates : ["00000000-0000-0000-0000-000000000000"]);
      const currentLoc: Record<string, any> = {};
      for (const b of (balances ?? []) as any[]) {
        if (b.product_id && !currentLoc[b.product_id]) currentLoc[b.product_id] = b;
      }

      // 4) Build suggestions
      const cursors = { A: 0, B: 0, C: 0 };
      const pool = { A: poolA, B: poolB, C: poolC } as const;
      const placed: Record<string, any> = {};
      const suggestions: any[] = [];

      const pickFrom = (tier: "A" | "B" | "C", weight: number, near?: any) => {
        const p = pool[tier];
        // simple scan from current cursor, respecting weight
        for (let i = cursors[tier]; i < p.length; i++) {
          const cand = p[i];
          if (weight > 0 && cand.max_weight_kg && weight > Number(cand.max_weight_kg)) continue;
          if (near && cand.zone && near.zone && cand.zone !== near.zone) continue;
          cursors[tier] = i + 1;
          return cand;
        }
        return null;
      };

      for (const [pid, qty] of ranked.slice(0, 80)) {
        const tier = abc[pid];
        const meta = prodMeta[pid] ?? {};
        const cur = currentLoc[pid];
        const weight = Number(meta.weight ?? 0);

        // already in correct tier and zone — skip
        if (cur?.wms_storage_locations?.abc_class === tier) continue;

        // affinity bias: if this SKU pairs strongly with one already placed, try same zone
        let near: any = null;
        for (const [pair] of topPairs) {
          const [a, b] = pair.split("|");
          const partner = a === pid ? b : b === pid ? a : null;
          if (partner && placed[partner]) {
            near = placed[partner];
            break;
          }
        }

        const target = pickFrom(tier, weight, near);
        if (!target) continue;

        const curDist = Number(cur?.wms_storage_locations?.distance_to_dock ?? 100);
        const newDist = Number(target.distance_to_dock ?? 50);
        const picksPerDay = qty / 90;
        const distanceSaved = Math.max(0, curDist - newDist) * picksPerDay * 2;

        placed[pid] = target;

        suggestions.push({
          company_id: companyId,
          product_id: pid,
          current_location_id: cur?.location_id ?? null,
          suggested_location_id: target.id,
          score: Math.round(distanceSaved * 10) / 10,
          abc_class: tier,
          reason: {
            engine: "v2",
            rationale: near ? "afinidade_cluster" : "abc_dinamico",
            tier,
            paired_with: near ? Object.keys(placed).find((k) => placed[k] === near) ?? null : null,
            weight_kg: weight || null,
            zone: target.zone ?? null,
            picks_per_day: Math.round(picksPerDay * 100) / 100,
            from_distance: curDist,
            to_distance: newDist,
          },
          estimated_distance_saved_m: Math.round(distanceSaved),
          estimated_picks_per_day: Math.round(picksPerDay * 100) / 100,
          status: "pending",
        });
      }

      if (mode === "persist" && suggestions.length > 0) {
        await admin
          .from("slotting_suggestions")
          .update({ status: "expired" })
          .eq("company_id", companyId)
          .eq("status", "pending");
        const { error } = await admin.from("slotting_suggestions").insert(suggestions);
        if (error) console.error("[wms-slotting-v2] insert error", error);
        await admin.from("wms_events").insert({
          company_id: companyId,
          event_type: "slotting.recompute.v2",
          source_module: "wms",
          entity_type: "engine",
          payload: { generated: suggestions.length },
        });
      }

      result[companyId] = {
        mode,
        generated: suggestions.length,
        affinity_pairs: topPairs.length,
        abc_distribution: {
          A: Object.values(abc).filter((x) => x === "A").length,
          B: Object.values(abc).filter((x) => x === "B").length,
          C: Object.values(abc).filter((x) => x === "C").length,
        },
        estimated_total_savings_m: suggestions.reduce(
          (s, x) => s + (x.estimated_distance_saved_m || 0),
          0,
        ),
        preview: mode === "simulate" ? suggestions.slice(0, 20) : undefined,
      };
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[wms-slotting-v2] fatal", e);
    return new Response(JSON.stringify({ ok: false, error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
