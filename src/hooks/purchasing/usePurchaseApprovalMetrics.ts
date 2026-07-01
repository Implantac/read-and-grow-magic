import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovalMetrics {
  from: string;
  to: string;
  totals: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    breached: number;
    breach_rate: number;
    avg_lead_time_hours: number;
  };
  by_approver: Array<{
    approver: string;
    total: number;
    approved: number;
    rejected: number;
    avg_hours: number;
  }>;
  by_requester: Array<{
    requester: string;
    total: number;
    approved: number;
    rejected: number;
    total_amount: number;
  }>;
  timeline: Array<{
    day: string;
    submitted: number;
    approved: number;
    rejected: number;
    breached: number;
  }>;
}

export function usePurchaseApprovalMetrics(days = 30) {
  return useQuery({
    queryKey: ["purchase_approvals_metrics", days],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const { data, error } = await supabase.rpc(
        "purchase_approvals_metrics" as any,
        { p_from: from.toISOString(), p_to: to.toISOString() }
      );
      if (error) throw error;
      return data as unknown as ApprovalMetrics;
    },
    staleTime: 60_000,
  });
}
