import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClientTier = "bronze" | "prata" | "ouro" | "diamante";
export type ClientLifecycle = "ativo" | "em_risco" | "inativo" | "sem_compras";

export interface ClientProfile {
  client_id: string;
  company_id: string;
  code: string | null;
  name: string;
  document: string | null;
  segment: string | null;
  region: string | null;
  sales_rep_id: string | null;
  status: string;
  total_orders: number;
  ltv: number;
  avg_ticket: number;
  first_order_date: string | null;
  last_order_date: string | null;
  days_since_last_order: number | null;
  orders_per_month: number;
  tier: ClientTier;
  lifecycle_status: ClientLifecycle;
}

export const TIER_META: Record<ClientTier, { label: string; color: string; min: number }> = {
  bronze:   { label: "Bronze",   color: "bg-amber-700/20 text-amber-500 border-amber-700/40", min: 0 },
  prata:    { label: "Prata",    color: "bg-slate-400/20 text-slate-300 border-slate-400/40", min: 5000 },
  ouro:     { label: "Ouro",     color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", min: 25000 },
  diamante: { label: "Diamante", color: "bg-cyan-400/20 text-cyan-300 border-cyan-400/40", min: 100000 },
};

export const LIFECYCLE_META: Record<ClientLifecycle, { label: string; color: string }> = {
  ativo:       { label: "Ativo",       color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  em_risco:    { label: "Em risco",    color: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
  inativo:     { label: "Inativo",     color: "bg-red-500/20 text-red-400 border-red-500/40" },
  sem_compras: { label: "Sem compras", color: "bg-muted text-muted-foreground border-border" },
};

export function useClientProfiles() {
  return useQuery({
    queryKey: ["commercial", "client-profiles"],
    queryFn: async (): Promise<ClientProfile[]> => {
      const { data, error } = await supabase
        .from("commercial_client_profiles" as any)
        .select("*")
        .order("ltv", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as ClientProfile[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
