import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PurchaseApprovalRule {
  id: string;
  company_id: string;
  level: number;
  min_amount: number;
  max_amount: number | null;
  approver_role: string;
  active: boolean;
}

export function usePurchaseApprovalRules() {
  return useQuery({
    queryKey: ["purchase_approval_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_approval_rules" as any)
        .select("*")
        .order("level", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PurchaseApprovalRule[];
    },
  });
}

export function useUpsertPurchaseApprovalRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<PurchaseApprovalRule>) => {
      const { data, error } = await supabase
        .from("purchase_approval_rules" as any)
        .upsert(rule as any, { onConflict: "company_id,level" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_approval_rules"] });
      toast.success("Regra de alçada salva");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao salvar regra"),
  });
}

export function useDeletePurchaseApprovalRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_approval_rules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchase_approval_rules"] }),
  });
}

export function useSubmitPOForApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (poId: string) => {
      const { data, error } = await supabase.rpc(
        "purchase_submit_for_approval" as any,
        { p_po_id: poId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      qc.invalidateQueries({ queryKey: ["po_pending_approvals"] });
      toast.success("Ordem enviada para aprovação");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha no envio"),
  });
}

export function usePendingPOApprovals() {
  return useQuery({
    queryKey: ["po_pending_approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_approvals")
        .select("*")
        .eq("status", "pending")
        .like("step_key", "po_l%")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDecidePOApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      approvalId: string;
      approve: boolean;
      comment?: string;
    }) => {
      const { data, error } = await supabase.rpc(
        "purchase_approval_decide" as any,
        {
          p_approval_id: args.approvalId,
          p_approve: args.approve,
          p_comment: args.comment ?? null,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po_pending_approvals"] });
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      toast.success("Decisão registrada");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao decidir"),
  });
}
