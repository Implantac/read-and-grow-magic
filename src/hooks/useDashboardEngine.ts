import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: "kpi" | "line" | "bar" | "pie" | "table" | string;
  title: string;
  data_source: string;
  config: Record<string, any>;
  position: { x?: number; y?: number; w?: number; h?: number };
}

export interface DashboardDefinition {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  layout: Record<string, any>;
  role_scope: string[] | null;
  is_default: boolean;
}

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
      mutationFn: async (payload: any & { name: string }) => {
        const { companyId, userId } = await ctx();
        if (payload.id) {
          const { error } = await supabase
            .from("dashboard_definitions")
            .update({
              name: payload.name,
              description: payload.description ?? null,
              layout: (payload.layout ?? {}) as any,
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
            layout: (payload.layout ?? {}) as any,
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
      onError: (e: any) => toast.error(e.message),
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
      onError: (e: any) => toast.error(e.message),
    }),
    saveWidget: useMutation({
      mutationFn: async (payload: any & { dashboard_id: string; title: string; widget_type: string; data_source: string }) => {
        const { companyId } = await ctx();
        if (payload.id) {
          const { error } = await supabase
            .from("dashboard_widgets")
            .update({
              title: payload.title,
              widget_type: payload.widget_type,
              data_source: payload.data_source,
              config: (payload.config ?? {}) as any,
              position: (payload.position ?? {}) as any,
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
            config: (payload.config ?? {}) as any,
            position: (payload.position ?? {}) as any,
          });
          if (error) throw error;
        }
      },
      onSuccess: (_d, vars) => {
        toast.success("Widget salvo");
        qc.invalidateQueries({ queryKey: ["dashboard_widgets", vars.dashboard_id] });
      },
      onError: (e: any) => toast.error(e.message),
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
      onError: (e: any) => toast.error(e.message),
    }),
  };
}
