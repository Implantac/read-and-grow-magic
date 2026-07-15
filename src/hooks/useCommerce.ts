import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { handleMutationError, toastSuccess } from "@/lib/toastHelpers";

export interface CommerceTheme {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  preview_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  price: number;
  author: string | null;
  tags: string[];
  default_config: Record<string, unknown>;
}

export interface Storefront {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  storefront_type: "b2c" | "b2b" | "hybrid";
  status: "draft" | "published" | "paused";
  theme_id: string | null;
  currency: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  settings: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCommerceThemes() {
  return useQuery({
    queryKey: ["commerce_themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commerce_themes")
        .select("*")
        .eq("is_published", true)
        .order("is_premium")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CommerceTheme[];
    },
  });
}

export function useCommerceTheme(themeId: string | null) {
  return useQuery({
    queryKey: ["commerce_theme", themeId],
    enabled: !!themeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commerce_themes")
        .select("*")
        .eq("id", themeId!)
        .maybeSingle();
      if (error) throw error;
      return data as CommerceTheme | null;
    },
  });
}

export function useStorefronts() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ["storefronts", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefronts")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Storefront[];
    },
  });
}

export function useStorefront(storefrontId: string | null) {
  return useQuery({
    queryKey: ["storefront", storefrontId],
    enabled: !!storefrontId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefronts")
        .select("*")
        .eq("id", storefrontId!)
        .maybeSingle();
      if (error) throw error;
      return data as Storefront | null;
    },
  });
}

interface CreateStorefrontInput {
  name: string;
  slug: string;
  storefront_type: "b2c" | "b2b" | "hybrid";
  theme_id: string | null;
  currency?: string;
  primary_color?: string;
  secondary_color?: string;
}

export function useCreateStorefront() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStorefrontInput) => {
      const companyId = useEnterpriseStore.getState().activeCompanyId;
      if (!companyId) throw new Error("Empresa não selecionada");
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("storefronts")
        .insert({
          company_id: companyId,
          name: input.name,
          slug: input.slug,
          storefront_type: input.storefront_type,
          theme_id: input.theme_id,
          currency: input.currency ?? "BRL",
          primary_color: input.primary_color ?? "#1A2234",
          secondary_color: input.secondary_color ?? "#FF9800",
          created_by: user.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Storefront;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storefronts"] });
      toastSuccess("Loja criada");
    },
    onError: handleMutationError,
  });
}

export function useUpdateStorefrontTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, theme_id }: { id: string; theme_id: string }) => {
      const { error } = await supabase
        .from("storefronts")
        .update({ theme_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["storefronts"] });
      qc.invalidateQueries({ queryKey: ["storefront", vars.id] });
      toastSuccess("Layout aplicado");
    },
    onError: handleMutationError,
  });
}

export function useUpdateStorefrontStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Storefront["status"];
    }) => {
      const { error } = await supabase
        .from("storefronts")
        .update(
          status === "published"
            ? { status, published_at: new Date().toISOString() }
            : { status },
        )
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storefronts"] });
    },
    onError: handleMutationError,
  });
}

export function useDeleteStorefront() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("storefronts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["storefronts"] });
      toastSuccess("Loja removida");
    },
    onError: handleMutationError,
  });
}
