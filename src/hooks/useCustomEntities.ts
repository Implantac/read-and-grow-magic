import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CustomFieldType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "multiselect"
  | "json";

export interface CustomEntity {
  id: string;
  name: string;
  label: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  entity_id: string;
  name: string;
  label: string;
  field_type: CustomFieldType;
  is_required: boolean;
  is_unique: boolean;
  default_value: any;
  options: any;
  validation: any;
  help_text: string | null;
  display_order: number;
  is_active: boolean;
}

export interface CustomRecord {
  id: string;
  entity_id: string;
  company_id: string;
  branch_id: string | null;
  data: Record<string, any>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomEntities() {
  return useQuery({
    queryKey: ["custom_entities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_entities")
        .select("*")
        .order("label", { ascending: true });
      if (error) throw error;
      return data as CustomEntity[];
    },
  });
}

export function useCustomFields(entityId: string | undefined) {
  return useQuery({
    queryKey: ["custom_fields", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("custom_fields")
        .select("*")
        .eq("entity_id", entityId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CustomField[];
    },
    enabled: !!entityId,
  });
}

export function useCustomRecords(entityId: string | undefined) {
  return useQuery({
    queryKey: ["custom_records", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("custom_records")
        .select("*")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomRecord[];
    },
    enabled: !!entityId,
  });
}

export function useEntityMutations() {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (payload: Partial<CustomEntity>) => {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (!userId) throw new Error("Não autenticado");
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", userId)
          .maybeSingle();
        if (!profile?.company_id) throw new Error("Empresa não encontrada");
        const { error } = await supabase.from("custom_entities").insert({
          name: payload.name!,
          label: payload.label!,
          description: payload.description ?? null,
          icon: payload.icon ?? null,
          company_id: profile.company_id,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Entidade criada");
        qc.invalidateQueries({ queryKey: ["custom_entities"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("custom_entities").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Entidade excluída");
        qc.invalidateQueries({ queryKey: ["custom_entities"] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
  };
}

export function useFieldMutations(entityId: string | undefined) {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (payload: Partial<CustomField>) => {
        if (!entityId) throw new Error("Entidade obrigatória");
        const { error } = await supabase.from("custom_fields").insert({
          entity_id: entityId,
          name: payload.name!,
          label: payload.label!,
          field_type: payload.field_type ?? "text",
          is_required: payload.is_required ?? false,
          is_unique: payload.is_unique ?? false,
          help_text: payload.help_text ?? null,
          options: payload.options ?? null,
          display_order: payload.display_order ?? 0,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Campo adicionado");
        qc.invalidateQueries({ queryKey: ["custom_fields", entityId] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("custom_fields").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Campo removido");
        qc.invalidateQueries({ queryKey: ["custom_fields", entityId] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
  };
}

export function useRecordMutations(entityId: string | undefined) {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (data: Record<string, any>) => {
        if (!entityId) throw new Error("Entidade obrigatória");
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (!userId) throw new Error("Não autenticado");
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", userId)
          .maybeSingle();
        if (!profile?.company_id) throw new Error("Empresa não encontrada");
        const { error } = await supabase.from("custom_records").insert({
          entity_id: entityId,
          company_id: profile.company_id,
          data,
          created_by: userId,
          updated_by: userId,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Registro criado");
        qc.invalidateQueries({ queryKey: ["custom_records", entityId] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    update: useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("custom_records")
          .update({ data, updated_by: userRes.user?.id })
          .eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Registro atualizado");
        qc.invalidateQueries({ queryKey: ["custom_records", entityId] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("custom_records").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Registro excluído");
        qc.invalidateQueries({ queryKey: ["custom_records", entityId] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
  };
}
