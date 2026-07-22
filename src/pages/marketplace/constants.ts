export type PriceFilter = "all" | "free" | "paid";
export type SortMode = "popular" | "top_rated" | "newest" | "price_asc" | "price_desc";

export const CATEGORY_LABEL: Record<string, string> = {
  all: "Todos",
  fiscal: "Fiscal",
  financial: "Financeiro",
  communication: "Comunicação",
  logistics: "Logística",
  bi: "BI & Analytics",
  ai: "Inteligência Artificial",
  payments: "Pagamentos",
  general: "Geral",
};
