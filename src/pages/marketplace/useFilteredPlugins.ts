import { useMemo } from "react";
import type { PriceFilter, SortMode } from "./constants";

interface Args {
  plugins: any[] | undefined;
  ratings: Record<string, { avg: number; count: number }> | undefined;
  search: string;
  category: string;
  price: PriceFilter;
  minRating: number;
  sort: SortMode;
}

export function useFilteredPlugins({ plugins, ratings, search, category, price, minRating, sort }: Args) {
  return useMemo(() => {
    const term = search.toLowerCase().trim();
    const list = (plugins ?? []).filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (price === "free" && p.price_monthly > 0) return false;
      if (price === "paid" && p.price_monthly <= 0) return false;
      const r = ratings?.[p.id];
      if (minRating > 0 && (!r || r.avg < minRating)) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.vendor?.toLowerCase().includes(term)
      );
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      const ra = ratings?.[a.id];
      const rb = ratings?.[b.id];
      switch (sort) {
        case "top_rated":
          return (rb?.avg ?? 0) - (ra?.avg ?? 0) || (rb?.count ?? 0) - (ra?.count ?? 0);
        case "popular":
          return (rb?.count ?? 0) - (ra?.count ?? 0) || (rb?.avg ?? 0) - (ra?.avg ?? 0);
        case "newest":
          return a.name.localeCompare(b.name);
        case "price_asc":
          return a.price_monthly - b.price_monthly;
        case "price_desc":
          return b.price_monthly - a.price_monthly;
      }
    });
    return sorted;
  }, [plugins, search, category, price, minRating, sort, ratings]);
}
