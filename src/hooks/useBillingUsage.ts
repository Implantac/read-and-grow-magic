import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";

export interface UsageSummaryRow {
  meter_key: string;
  meter_name: string;
  total_quantity: number;
  total_amount: number;
  currency: string;
}

export interface BillingMeterRow {
  id: string;
  meter_key: string;
  name: string;
  description: string | null;
  unit: string;
  unit_price: number;
  currency: string;
  active: boolean;
}

export interface UsageEventRow {
  id: string;
  meter_key: string;
  quantity: number;
  unit_price: number;
  amount: number;
  currency: string;
  source: string | null;
  occurred_at: string;
  period_ym: string;
  metadata: Record<string, unknown>;
}

export function useBillingMeters() {
  return useQuery({
    queryKey: ["billing_meters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_meters")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as BillingMeterRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentUsageSummary() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["billing_usage_summary", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_current_usage_summary", {
        _company_id: companyId!,
      });
      if (error) throw error;
      return (data ?? []) as UsageSummaryRow[];
    },
  });
}

export function useRecentUsageEvents(limit = 50) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["billing_usage_events", companyId, limit],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_usage_events")
        .select("*")
        .eq("company_id", companyId!)
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as UsageEventRow[];
    },
  });
}
