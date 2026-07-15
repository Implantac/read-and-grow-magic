import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

export interface Plugin {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  vendor: string | null;
  version: string;
  icon: string | null;
  required_modules: string[];
  price_monthly: number;
  is_published: boolean;
  long_description?: string | null;
  screenshots?: string[];
  homepage_url?: string | null;
  min_app_version?: string | null;
}

export function usePluginDetail(pluginId: string | null) {
  return useQuery({
    queryKey: ["plugin_detail", pluginId],
    enabled: !!pluginId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugins")
        .select("*")
        .eq("id", pluginId!)
        .maybeSingle();
      if (error) throw error;
      return data as Plugin | null;
    },
  });
}

export interface PluginInstallation {
  id: string;
  company_id: string;
  plugin_id: string;
  status: "active" | "disabled" | "uninstalled";
  config: Record<string, unknown>;
  installed_at: string;
  pinned_version: string | null;
  auto_update: boolean;
}

export interface PluginVersion {
  id: string;
  plugin_id: string;
  version: string;
  changelog: string | null;
  published_at: string;
}

export function usePluginVersions(pluginId: string | null) {
  return useQuery({
    queryKey: ["plugin_versions", pluginId],
    enabled: !!pluginId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_versions")
        .select("id, plugin_id, version, changelog, published_at")
        .eq("plugin_id", pluginId!)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PluginVersion[];
    },
  });
}

export function usePinPluginVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: string | null }) => {
      const { error } = await supabase
        .from("plugin_installations")
        .update({ pinned_version: version })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
      toastSuccess("Versão atualizada");
    },
    onError: handleMutationError,
  });
}

export function usePlugins() {
  return useQuery({
    queryKey: ["plugins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugins")
        .select("*")
        .eq("is_published", true)
        .order("category");
      if (error) throw error;
      return (data ?? []) as Plugin[];
    },
  });
}

export function usePluginInstallations() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["plugin_installations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plugin_installations")
        .select("*")
        .eq("company_id", companyId!)
        .neq("status", "uninstalled");
      if (error) throw error;
      return (data ?? []) as PluginInstallation[];
    },
  });
}

export function useInstallPlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pluginId: string) => {
      const companyId = useEnterpriseStore.getState().activeCompanyId;
      if (!companyId) throw new Error("Empresa não selecionada");
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("plugin_installations")
        .upsert(
          {
            company_id: companyId,
            plugin_id: pluginId,
            status: "active",
            installed_by: user.user?.id ?? null,
          },
          { onConflict: "company_id,plugin_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
      toastSuccess("Plugin instalado");
    },
    onError: handleMutationError,
  });
}

export function useUninstallPlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (installationId: string) => {
      const { error } = await supabase
        .from("plugin_installations")
        .update({ status: "uninstalled", uninstalled_at: new Date().toISOString() })
        .eq("id", installationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
      toastSuccess("Plugin desinstalado");
    },
    onError: handleMutationError,
  });
}

export function useTogglePlugin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("plugin_installations")
        .update({ status: enabled ? "active" : "disabled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plugin_installations"] });
    },
    onError: handleMutationError,
  });
}
