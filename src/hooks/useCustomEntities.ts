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
  entity_key: string;
  label: string;
  label_plural: string | null;
  module_key: string | null;
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
  field_key: string;
  label: string;
  field_type: string;
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
      return (data ?? []) as unknown as CustomEntity[];
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
      return (data ?? []) as unknown as CustomField[];
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
      return (data ?? []) as unknown as CustomRecord[];
    },
    enabled: !!entityId,
  });
}

async function currentCompanyId(): Promise<{ userId: string; companyId: string }> {
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

export function useEntityMutations() {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (payload: { entity_key: string; label: string; label_plural?: string; description?: string; icon?: string; module_key?: string }) => {
        const { companyId } = await currentCompanyId();
        const { error } = await supabase.from("custom_entities").insert({
          entity_key: payload.entity_key,
          label: payload.label,
          label_plural: payload.label_plural ?? payload.label,
          description: payload.description ?? null,
          icon: payload.icon ?? null,
          module_key: payload.module_key ?? "custom",
          company_id: companyId,
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
      mutationFn: async (payload: { field_key: string; label: string; field_type: string; is_required?: boolean; is_unique?: boolean; help_text?: string; options?: any; display_order?: number }) => {
        if (!entityId) throw new Error("Entidade obrigatória");
        const { companyId } = await currentCompanyId();
        const { error } = await supabase.from("custom_fields").insert({
          entity_id: entityId,
          company_id: companyId,
          field_key: payload.field_key,
          label: payload.label,
          field_type: payload.field_type,
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

export interface CustomRelationship {
  id: string;
  company_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: "one_to_many" | "many_to_many" | "many_to_one" | string;
  from_field: string;
  to_field: string;
  cascade_delete: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomRelationships(entityId: string | undefined) {
  return useQuery({
    queryKey: ["custom_relationships", entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("custom_relationships")
        .select("*")
        .or(`from_entity_id.eq.${entityId},to_entity_id.eq.${entityId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustomRelationship[];
    },
    enabled: !!entityId,
  });
}

export function useRelationshipMutations(entityId: string | undefined) {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (payload: {
        to_entity_id: string;
        relationship_type: string;
        from_field: string;
        to_field: string;
        cascade_delete?: boolean;
      }) => {
        if (!entityId) throw new Error("Entidade obrigatória");
        const { companyId } = await currentCompanyId();
        const { error } = await supabase.from("custom_relationships").insert({
          company_id: companyId,
          from_entity_id: entityId,
          to_entity_id: payload.to_entity_id,
          relationship_type: payload.relationship_type,
          from_field: payload.from_field,
          to_field: payload.to_field,
          cascade_delete: payload.cascade_delete ?? false,
        });
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Relacionamento criado");
        qc.invalidateQueries({ queryKey: ["custom_relationships", entityId] });
      },
      onError: (e: any) => toast.error(e.message),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from("custom_relationships").delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        toast.success("Relacionamento removido");
        qc.invalidateQueries({ queryKey: ["custom_relationships", entityId] });
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
        const { userId, companyId } = await currentCompanyId();
        const { error } = await supabase.from("custom_records").insert({
          entity_id: entityId,
          company_id: companyId,
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
        const { userId } = await currentCompanyId();
        const { error } = await supabase
          .from("custom_records")
          .update({ data, updated_by: userId })
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
