import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutomationAction {
  type: "notify" | "create_record" | "update_record" | "webhook" | "start_workflow";
  config: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains";
  value: any;
}

export interface AutomationRule {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function ctx() {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", userId).maybeSingle();
  if (!profile?.company_id) throw new Error("Empresa não encontrada");
  return { userId, companyId: profile.company_id };
}

export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AutomationRule[];
    },
  });
}

export function useAutomationRuns(ruleId?: string) {
  return useQuery({
    queryKey: ["automation_runs", ruleId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(100);
      if (ruleId) q = q.eq("rule_id", ruleId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAutomationMutations() {
  const qc = useQueryClient();
  return {
    save: useMutation({
      mutationFn: async (payload: Partial<AutomationRule> & { name: string; trigger_event: string; actions: AutomationAction[] }) => {
        const { companyId, userId } = await ctx();
        if (payload.id) {
          const { error } = await supabase
            .from("automation_rules")
            .update({
              name: payload.name,
              description: payload.description ?? null,
              trigger_event: payload.trigger_event,
              conditions: (payload.conditions ?? []) as any,
              actions: payload.actions as any,
              is_active: payload.is_active ?? true,
            })
            .eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("automation_rules").insert({
            company_id: companyId,
            name: payload.name,
            description: payload.description ?? null,
            trigger_event: payload.trigger_event,
            conditions: (payload.conditions ?? []) as any,
            actions: payload.actions as any,
            is_active: payload.is_active ?? true,
            created_by: userId,
          });
          if (error) throw error;
        }
      },
      onSuccess: () => {
        toast.success("Regra salva");
        qc.invalidateQueries({ queryKey: ["automation_rules"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("automation_rules").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Regra removida");
        qc.invalidateQueries({ queryKey: ["automation_rules"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    toggle: useMutation({
      mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
        const { error } = await supabase.from("automation_rules").update({ is_active }).eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["automation_rules"] }),
      onError: (e: any) => toast.error(e.message),
    }),
  };
}
