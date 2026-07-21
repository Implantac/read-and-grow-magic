import type { StorefrontSearchItem } from "@/hooks/useStorefrontSearch";

export const BRL = (v: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(v);

export function priceOf(it: StorefrontSearchItem) {
  return it.public_price ?? it.product.sale_price ?? 0;
}

export type SortKey = "relevance" | "price_asc" | "price_desc" | "rating_desc" | "featured";
export type ViewMode = "pagination" | "infinite";
