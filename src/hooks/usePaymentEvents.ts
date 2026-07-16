import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentEvent {
  id: string;
  order_id: string | null;
  provider: string;
  event_type: string;
  external_id: string | null;
  status_before: string | null;
  status_after: string | null;
  amount: number | null;
  raw_payload: Record<string, unknown>;
  signature_valid: boolean | null;
  processed_at: string;
  created_at: string;
}

export function usePaymentEventsForStorefront(storefrontId: string | undefined) {
  return useQuery({
    queryKey: ["payment_events_storefront", storefrontId],
    enabled: !!storefrontId,
    queryFn: async () => {
      // Busca IDs de pedidos da loja e depois eventos correspondentes
      const { data: orders, error: ordersErr } = await supabase
        .from("storefront_orders")
        .select("id")
        .eq("storefront_id", storefrontId!);
      if (ordersErr) throw ordersErr;
      const ids = (orders ?? []).map((o) => (o as { id: string }).id);
      if (ids.length === 0) return [] as PaymentEvent[];

      const { data, error } = await supabase
        .from("storefront_payment_events")
        .select("*")
        .in("order_id", ids)
        .order("processed_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as PaymentEvent[];
    },
    refetchInterval: 15_000,
  });
}
