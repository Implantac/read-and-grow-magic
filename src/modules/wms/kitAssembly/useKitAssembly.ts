import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Assembly, KitRow, Product } from "./types";

export function useKitAssembly() {
  const [kits, setKits] = useState<KitRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: prods }, { data: kitData }, { data: comps }, { data: asms }] = await Promise.all([
      supabase.from("products").select("id, code, name").order("name").limit(500),
      supabase.from("wms_kits").select("*").order("created_at", { ascending: false }),
      supabase.from("wms_kit_components").select("*"),
      supabase
        .from("wms_kit_assemblies")
        .select("*, kit:wms_kits(code, name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const productMap = new Map((prods ?? []).map((p) => [p.id, p]));
    setProducts(prods ?? []);
    setKits(
      (kitData ?? []).map((k: any) => ({
        ...k,
        parent: productMap.get(k.parent_product_id) ?? null,
        components: (comps ?? [])
          .filter((c: any) => c.kit_id === k.id)
          .map((c: any) => ({ ...c, product: productMap.get(c.component_product_id) ?? null })),
      })),
    );
    setAssemblies((asms ?? []) as Assembly[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return { kits, products, assemblies, loading, reload: load };
}
