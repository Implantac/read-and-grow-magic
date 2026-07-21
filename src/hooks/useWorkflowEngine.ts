import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { resolveNextStep, type Branch } from "@/lib/workflowConditions";

export interface WorkflowStep {
  key: string;
  label: string;
  type?: "approval" | "task" | "automatic" | "notification";
  assignee_role?: string;
  next?: string;
  branches?: Branch[];
  sla_hours?: number;
  conditions?: unknown;
}

export interface WorkflowTransition {
  id: string;
  company_id: string;
  instance_id: string;
  from_step: string | null;
  to_step: string;
  actor_id: string | null;
  comment: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowDefinition {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  target_entity: string;
  version: number;
  steps: WorkflowStep[];
  initial_step: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  company_id: string;
  definition_id: string;
  target_entity: string;
  target_record_id: string | null;
  current_step: string | null;
  status: string;
  context: any;
  started_by: string | null;
  completed_at: string | null;
  created_at: string;
}

async function currentCompanyId() {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.company_id) throw new Error("Empresa não encontrada");
  return { userId, companyId: profile.company_id };
}

export function useWorkflowDefinitions() {
  return useQuery({
    queryKey: ["workflow_definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_definitions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WorkflowDefinition[];
    },
  });
}

export function useWorkflowInstances(definitionId?: string) {
  return useQuery({
    queryKey: ["workflow_instances", definitionId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("workflow_instances").select("*").order("created_at", { ascending: false });
      if (definitionId) q = q.eq("definition_id", definitionId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as WorkflowInstance[];
    },
  });
}

export function useWorkflowMutations() {
  const qc = useQueryClient();
  return {
    saveDefinition: useMutation({
      mutationFn: async (payload: any & { name: string; target_entity: string; steps: WorkflowStep[] }) => {
        const { companyId, userId } = await currentCompanyId();
        if (payload.id) {
          const { error } = await supabase
            .from("workflow_definitions")
            .update({
              name: payload.name,
              description: payload.description ?? null,
              target_entity: payload.target_entity,
              steps: payload.steps as any,
              initial_step: payload.initial_step ?? payload.steps[0]?.key ?? null,
              is_active: payload.is_active ?? true,
            })
            .eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("workflow_definitions").insert({
            company_id: companyId,
            name: payload.name,
            description: payload.description ?? null,
            target_entity: payload.target_entity,
            steps: payload.steps as any,
            initial_step: payload.initial_step ?? payload.steps[0]?.key ?? null,
            is_active: payload.is_active ?? true,
            created_by: userId,
          });
          if (error) throw error;
        }
      },
      onSuccess: () => {
        toast.success("Workflow salvo");
        qc.invalidateQueries({ queryKey: ["workflow_definitions"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("workflow_definitions").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Workflow excluído");
        qc.invalidateQueries({ queryKey: ["workflow_definitions"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    startInstance: useMutation({
      mutationFn: async (payload: { definition_id: string; target_record_id?: string; context?: any }) => {
        const { companyId, userId } = await currentCompanyId();
        const { data: def, error: defErr } = await supabase
          .from("workflow_definitions")
          .select("target_entity, initial_step, steps")
          .eq("id", payload.definition_id)
          .maybeSingle();
        if (defErr || !def) throw defErr ?? new Error("Workflow não encontrado");
        const steps = (def.steps as any as WorkflowStep[]) ?? [];
        const initial = def.initial_step ?? steps[0]?.key ?? null;
        const { data: inst, error } = await supabase
          .from("workflow_instances")
          .insert({
            company_id: companyId,
            definition_id: payload.definition_id,
            target_entity: def.target_entity,
            target_record_id: payload.target_record_id ?? null,
            current_step: initial,
            status: "running",
            context: payload.context ?? {},
            started_by: userId,
          })
          .select()
          .single();
        if (error) throw error;
        await supabase.from("workflow_transitions").insert({
          company_id: companyId,
          instance_id: inst.id,
          from_step: null,
          to_step: initial ?? "start",
          actor_id: userId,
          comment: "Início do workflow",
        });
        return inst;
      },
      onSuccess: () => {
        toast.success("Instância iniciada");
        qc.invalidateQueries({ queryKey: ["workflow_instances"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    advance: useMutation({
      mutationFn: async (payload: { instance_id: string; to_step?: string; comment?: string; complete?: boolean; contextPatch?: Record<string, unknown> }) => {
        const { companyId, userId } = await currentCompanyId();
        const { data: inst, error: iErr } = await supabase
          .from("workflow_instances")
          .select("current_step, context, definition_id")
          .eq("id", payload.instance_id)
          .maybeSingle();
        if (iErr || !inst) throw iErr ?? new Error("Instância não encontrada");

        const mergedContext = { ...(inst.context as Record<string, unknown> ?? {}), ...(payload.contextPatch ?? {}) };

        // Auto-resolve next step via branches when not provided
        let nextStep = payload.to_step ?? null;
        if (!nextStep) {
          const { data: def } = await supabase
            .from("workflow_definitions")
            .select("steps")
            .eq("id", inst.definition_id)
            .maybeSingle();
          const steps = ((def?.steps as unknown) as WorkflowStep[]) ?? [];
          const current = steps.find((s) => s.key === inst.current_step);
          nextStep = resolveNextStep(current?.branches, current?.next ?? null, mergedContext);
          if (!nextStep) throw new Error("Não foi possível determinar a próxima etapa (sem next/branches).");
        }

        const { error: uErr } = await supabase
          .from("workflow_instances")
          .update({
            current_step: nextStep,
            status: payload.complete ? "completed" : "running",
            completed_at: payload.complete ? new Date().toISOString() : null,
            context: mergedContext as any,
          })
          .eq("id", payload.instance_id);
        if (uErr) throw uErr;
        await supabase.from("workflow_transitions").insert({
          company_id: companyId,
          instance_id: payload.instance_id,
          from_step: inst.current_step,
          to_step: nextStep,
          actor_id: userId,
          comment: payload.comment ?? null,
          payload: (payload.contextPatch ?? {}) as any,
        });
      },
      onSuccess: () => {
        toast.success("Etapa avançada");
        qc.invalidateQueries({ queryKey: ["workflow_instances"] });
        qc.invalidateQueries({ queryKey: ["workflow_transitions"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
  };
}

export function useWorkflowHistory(instanceId?: string) {
  return useQuery({
    queryKey: ["workflow_transitions", instanceId ?? "none"],
    enabled: !!instanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_transitions")
        .select("*")
        .eq("instance_id", instanceId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as WorkflowTransition[];
    },
  });
}

