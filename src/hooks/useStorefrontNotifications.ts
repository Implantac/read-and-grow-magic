import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StorefrontNotification {
  id: string;
  order_id: string;
  storefront_id: string;
  event_type: string;
  channel: string;
  recipient: string | null;
  subject: string | null;
  body: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useStorefrontNotifications(orderId?: string) {
  return useQuery({
    queryKey: ["commerce", "notifications", orderId ?? "all"],
    queryFn: async (): Promise<StorefrontNotification[]> => {
      let q = supabase
        .from("storefront_notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (orderId) q = q.eq("order_id", orderId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as StorefrontNotification[];
    },
    staleTime: 30 * 1000,
  });
}

export function useDispatchNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("commerce-notify", { body: { limit: 25 } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Notificações processadas: ${data?.processed ?? 0}`);
      qc.invalidateQueries({ queryKey: ["commerce", "notifications"] });
    },
    onError: (e: any) => toast.error("Falha ao disparar notificações: " + (e?.message ?? e)),
  });
}

export function useToggleAutoAuthorizeNfce() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storefrontId, value }: { storefrontId: string; value: boolean }) => {
      const { error } = await supabase
        .from("storefronts")
        .update({ auto_authorize_nfce: value })
        .eq("id", storefrontId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preferência atualizada");
      qc.invalidateQueries({ queryKey: ["commerce", "storefronts"] });
    },
    onError: (e: any) => toast.error("Erro: " + (e?.message ?? e)),
  });
}
