import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WorkflowTrigger {
  id: string;
  company_id: string;
  workflow_definition_id: string;
  event_type: string;
  source_module: string | null;
  condition: Record<string, unknown>;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

export function useWorkflowTriggers() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["workflow_triggers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_triggers" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as WorkflowTrigger[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<WorkflowTrigger> & { workflow_definition_id: string; event_type: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: prof } = await supabase.from("profiles").select("company_id").eq("id", u.user.id).maybeSingle();
      const company_id = (prof as { company_id?: string } | null)?.company_id;
      if (!company_id) throw new Error("Tenant não resolvido");
      const row = { ...payload, company_id, created_by: u.user.id };
      const { error } = await supabase.from("workflow_triggers" as never).upsert(row as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow_triggers"] });
      toast.success("Gatilho salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workflow_triggers" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow_triggers"] });
      toast.success("Gatilho removido");
    },
  });

  return { triggers: list.data ?? [], isLoading: list.isLoading, upsert, remove };
}
