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

export interface DailyUsagePoint {
  day: string; // YYYY-MM-DD
  total: number;
  [meterKey: string]: number | string;
}

/**
 * Aggregates the current-month usage events into a per-day series,
 * with one numeric column per meter_key plus a `total`. Pure client-side
 * aggregation over the events the user already fetched — no extra RPC.
 */
export function useDailyUsageSeries() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["billing_usage_daily", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("billing_usage_events")
        .select("meter_key, amount, occurred_at")
        .eq("company_id", companyId!)
        .gte("occurred_at", start.toISOString())
        .order("occurred_at", { ascending: true });
      if (error) throw error;

      const meters = new Set<string>();
      const byDay = new Map<string, DailyUsagePoint>();
      for (const ev of (data ?? []) as Array<{
        meter_key: string;
        amount: number;
        occurred_at: string;
      }>) {
        const day = ev.occurred_at.slice(0, 10);
        meters.add(ev.meter_key);
        const row = byDay.get(day) ?? { day, total: 0 };
        const prev = Number(row[ev.meter_key] ?? 0);
        row[ev.meter_key] = prev + Number(ev.amount || 0);
        row.total = Number(row.total) + Number(ev.amount || 0);
        byDay.set(day, row);
      }
      return {
        meters: Array.from(meters),
        points: Array.from(byDay.values()).sort((a, b) =>
          a.day.localeCompare(b.day),
        ),
      };
    },
  });
}
