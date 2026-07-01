/**
 * Fase 3 — useAuditTrail
 * Hook padronizado para consumir `system_audit_logs` filtrando por entidade
 * (tabela + id). Retorna eventos ordenados por data e helpers de rótulo.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AuditEvent {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Options {
  entityType: string;
  entityId?: string | null;
  limit?: number;
}

export function useAuditTrail({ entityType, entityId, limit = 50 }: Options) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!entityType) return;
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("system_audit_logs")
        .select("id, action, entity_type, entity_id, user_id, metadata, created_at")
        .eq("entity_type", entityType)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (entityId) q = q.eq("entity_id", entityId);
      const { data, error } = await q;
      if (error) throw error;
      setEvents((data ?? []) as AuditEvent[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar auditoria");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, loading, error, reload: load };
}

export function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    insert: "Criação",
    update: "Atualização",
    delete: "Exclusão",
    approve: "Aprovação",
    reject: "Rejeição",
    login: "Login",
    logout: "Logout",
    export: "Exportação",
  };
  return map[action.toLowerCase()] ?? action;
}
