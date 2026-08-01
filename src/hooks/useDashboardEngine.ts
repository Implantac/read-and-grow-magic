import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
// Converte estruturas tipadas do domínio para o tipo `Json` do Postgres.
const toJson = (value: unknown): Json => value as Json;


export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: "kpi" | "line" | "bar" | "pie" | "table" | string;
  title: string;
  data_source: string;
  config: Record<string, unknown>;
  position: { x?: number; y?: number; w?: number; h?: number };
}

export interface DashboardDefinition {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  layout: Record<string, unknown>;
  role_scope: string[] | null;
  is_default: boolean;
}

export type DashboardPayload = Partial<DashboardDefinition> & { name: string };
export type WidgetPayload = Partial<DashboardWidget> & {
  dashboard_id: string;
  title: string;
  widget_type: string;
  data_source: string;
};

async function ctx() {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error("Não autenticado");
  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", userId).maybeSingle();
  if (!profile?.company_id) throw new Error("Empresa não encontrada");
  return { userId, companyId: profile.company_id };
}

export function useDashboards() {
  return useQuery({
    queryKey: ["dashboard_definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_definitions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DashboardDefinition[];
    },
  });
}

export function useDashboardWidgets(dashboardId?: string) {
  return useQuery({
    queryKey: ["dashboard_widgets", dashboardId],
    queryFn: async () => {
      if (!dashboardId) return [];
      const { data, error } = await supabase
        .from("dashboard_widgets")
        .select("*")
        .eq("dashboard_id", dashboardId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DashboardWidget[];
    },
    enabled: !!dashboardId,
  });
}

export function useDashboardMutations() {
  const qc = useQueryClient();
  return {
    saveDashboard: useMutation({
      mutationFn: async (payload: DashboardPayload) => {
        const { companyId, userId } = await ctx();
        if (payload.id) {
          const { error } = await supabase
            .from("dashboard_definitions")
            .update({
              name: payload.name,
              description: payload.description ?? null,
              layout: toJson(payload.layout ?? {}),
              role_scope: payload.role_scope ?? null,
              is_default: payload.is_default ?? false,
            })
            .eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("dashboard_definitions").insert({
            company_id: companyId,
            name: payload.name,
            description: payload.description ?? null,
            layout: toJson(payload.layout ?? {}),
            role_scope: payload.role_scope ?? null,
            is_default: payload.is_default ?? false,
            created_by: userId,
          });
          if (error) throw error;
        }
      },
      onSuccess: () => {
        toast.success("Dashboard salvo");
        qc.invalidateQueries({ queryKey: ["dashboard_definitions"] });
      },
      onError: (e: Error) => toast.error(e.message),
    }),
    removeDashboard: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("dashboard_definitions").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Dashboard removido");
        qc.invalidateQueries({ queryKey: ["dashboard_definitions"] });
      },
      onError: (e: Error) => toast.error(e.message),
    }),
    saveWidget: useMutation({
      mutationFn: async (payload: WidgetPayload) => {
        const { companyId } = await ctx();
        if (payload.id) {
          const { error } = await supabase
            .from("dashboard_widgets")
            .update({
              title: payload.title,
              widget_type: payload.widget_type,
              data_source: payload.data_source,
              config: toJson(payload.config ?? {}),
              position: toJson(payload.position ?? {}),
            })
            .eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("dashboard_widgets").insert({
            company_id: companyId,
            dashboard_id: payload.dashboard_id,
            title: payload.title,
            widget_type: payload.widget_type,
            data_source: payload.data_source,
            config: toJson(payload.config ?? {}),
            position: toJson(payload.position ?? {}),
          });
          if (error) throw error;
        }
      },
      onSuccess: (_d, vars) => {
        toast.success("Widget salvo");
        qc.invalidateQueries({ queryKey: ["dashboard_widgets", vars.dashboard_id] });
      },
      onError: (e: Error) => toast.error(e.message),
    }),
    removeWidget: useMutation({
      mutationFn: async ({ id }: { id: string; dashboard_id: string }) => {
        const { error } = await supabase.from("dashboard_widgets").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: (_d, vars) => {
        toast.success("Widget removido");
        qc.invalidateQueries({ queryKey: ["dashboard_widgets", vars.dashboard_id] });
      },
      onError: (e: Error) => toast.error(e.message),
    }),
  };
}
