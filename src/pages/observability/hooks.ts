import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Health, SystemEvent, Incident, AlertRule } from "./types";

export function useObservabilityData(companyId: string | null, sevFilter: string) {
  const qc = useQueryClient();

  const health = useQuery({
    queryKey: ["tenant_health", companyId],
    enabled: !!companyId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_tenant_health");
      if (error) throw error;
      return data as unknown as Health;
    },
  });

  const events = useQuery({
    queryKey: ["system_events", companyId, sevFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from("system_events").select("*").order("occurred_at", { ascending: false }).limit(50);
      if (sevFilter !== "all") q = q.eq("severity", sevFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SystemEvent[];
    },
  });

  const incidents = useQuery({
    queryKey: ["system_incidents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("system_incidents").select("*").order("opened_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Incident[];
    },
  });

  const rules = useQuery({
    queryKey: ["alert_rules", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from("alert_rules").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AlertRule[];
    },
  });

  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`obs-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "system_events", filter: `company_id=eq.${companyId}` },
        () => { qc.invalidateQueries({ queryKey: ["system_events"] }); qc.invalidateQueries({ queryKey: ["tenant_health"] }); })
      .on("postgres_changes", { event: "*", schema: "public", table: "system_incidents", filter: `company_id=eq.${companyId}` },
        () => { qc.invalidateQueries({ queryKey: ["system_incidents"] }); qc.invalidateQueries({ queryKey: ["tenant_health"] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, qc]);

  return { health, events, incidents, rules };
}

export function useIncidentMutations(companyId: string | null) {
  const qc = useQueryClient();

  const createIncident = useMutation({
    mutationFn: async (form: { title: string; description: string; severity: Incident["severity"] }) => {
      if (!companyId) return;
      const { error } = await supabase.from("system_incidents").insert({
        company_id: companyId, title: form.title, description: form.description || null,
        severity: form.severity, status: "open", source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Incidente registrado"); qc.invalidateQueries({ queryKey: ["system_incidents"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Incident["status"]; notes?: string }) => {
      const patch: any = { status };
      if (status === "mitigating") patch.acknowledged_at = new Date().toISOString();
      if (status === "resolved") {
        patch.resolved_at = new Date().toISOString();
        if (notes) patch.resolution_notes = notes;
      }
      const { error } = await supabase.from("system_incidents").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system_incidents"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return { createIncident, updateStatus };
}

export function useAlertRuleMutations(companyId: string | null) {
  const qc = useQueryClient();

  const createRule = useMutation({
    mutationFn: async (rule: Omit<AlertRule, "id" | "enabled" | "last_triggered_at">) => {
      if (!companyId) return;
      const { error } = await supabase.from("alert_rules").insert({
        company_id: companyId, name: rule.name, source: rule.source?.trim() || null,
        min_severity: rule.min_severity, threshold: rule.threshold,
        window_minutes: rule.window_minutes, incident_severity: rule.incident_severity,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Regra de alerta criada"); qc.invalidateQueries({ queryKey: ["alert_rules"] }); },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("alert_rules").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert_rules"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alert_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert_rules"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  return { createRule, toggleRule, deleteRule };
}

export const sevColor: Record<string, string> = {
  critical: "destructive", error: "destructive", warning: "secondary", info: "outline", debug: "outline",
};
