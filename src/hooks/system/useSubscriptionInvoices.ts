import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  billing_cycle: string;
  checkout_url: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  plan_id: string;
}

/** Faturas de assinatura da empresa atual (somente leitura — escrita é do servidor). */
export function useSubscriptionInvoices(limit = 24) {
  return useQuery({
    queryKey: ["subscription_invoices", limit],
    staleTime: 60_000,
    queryFn: async (): Promise<SubscriptionInvoice[]> => {
      const { data, error } = await supabase
        .from("subscription_invoices")
        .select(
          "id, amount, currency, status, provider, billing_cycle, checkout_url, due_date, paid_at, created_at, plan_id",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SubscriptionInvoice[];
    },
  });
}
