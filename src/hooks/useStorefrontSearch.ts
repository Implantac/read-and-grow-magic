import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicStorefront {
  id: string;
  slug: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  currency: string;
}

export interface PublicCategory {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface StorefrontSearchItem {
  id: string;
  storefront_id: string;
  product_id: string;
  public_price: number | null;
  compare_at_price: number | null;
  is_featured: boolean;
  rating: number | null;
  rating_count: number;
  gallery_urls: string[];
  seo_title: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    sale_price: number;
    category_id: string | null;
    subcategory: string | null;
    brand: string | null;
  };
}

export function usePublicStorefrontBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["public_storefront", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefronts")
        .select("id, slug, name, primary_color, secondary_color, logo_url, currency")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PublicStorefront | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStorefrontSearchItems(storefrontId: string | undefined) {
  return useQuery({
    queryKey: ["storefront_search_items", storefrontId],
    enabled: !!storefrontId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefront_products")
        .select(
          `
          id, storefront_id, product_id, public_price, compare_at_price,
          is_featured, rating, rating_count, gallery_urls, seo_title,
          product:products!inner(
            id, name, description, image_url, sale_price,
            category_id, subcategory, brand
          )
        `
        )
        .eq("storefront_id", storefrontId!)
        .eq("is_visible", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as StorefrontSearchItem[];
    },
    staleTime: 60 * 1000,
  });
}

export function useStorefrontCategories(items: StorefrontSearchItem[] | undefined) {
  const ids = Array.from(
    new Set((items ?? []).map((i) => i.product.category_id).filter(Boolean) as string[])
  );
  return useQuery({
    queryKey: ["storefront_categories", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      // Fetch categories + their parents (single level of hierarchy)
      const { data: level1, error: e1 } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .in("id", ids);
      if (e1) throw e1;
      const parentIds = Array.from(
        new Set((level1 ?? []).map((c) => c.parent_id).filter(Boolean) as string[])
      );
      let parents: PublicCategory[] = [];
      if (parentIds.length > 0) {
        const { data: level2, error: e2 } = await supabase
          .from("categories")
          .select("id, name, parent_id")
          .in("id", parentIds);
        if (e2) throw e2;
        parents = (level2 ?? []) as PublicCategory[];
      }
      return [...(level1 ?? []), ...parents] as PublicCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
