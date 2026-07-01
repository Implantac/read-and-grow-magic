/**
 * Fase 3 — AuditTrailPanel
 * Painel plugável de trilha de auditoria por entidade.
 * Usa VirtualList para escalar até milhares de eventos.
 */
import { useAuditTrail, formatAuditAction } from "@/shared/hooks/useAuditTrail";
import { VirtualList } from "./VirtualList";
import { ListSkeleton } from "./Skeletons";
import { EmptyState } from "./EmptyState";
import { Badge } from "@/ui/base/badge";
import { History, User } from "lucide-react";

interface Props {
  entityType: string;
  entityId?: string | null;
  limit?: number;
  height?: number;
}

export function AuditTrailPanel({ entityType, entityId, limit = 200, height = 420 }: Props) {
  const { events, loading, error } = useAuditTrail({ entityType, entityId, limit });

  if (loading) return <ListSkeleton rows={6} />;
  if (error) {
    return (
      <div className="text-sm text-destructive p-3 border border-destructive/30 rounded-md bg-destructive/5">
        {error}
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem eventos de auditoria"
        description="Nenhuma alteração registrada para este item ainda."
      />
    );
  }

  return (
    <VirtualList
      items={events}
      rowHeight={64}
      height={height}
      renderRow={(ev) => (
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b hover:bg-muted/30">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {formatAuditAction(ev.action)}
              </Badge>
              {ev.entity_type && (
                <span className="text-[11px] text-muted-foreground truncate">{ev.entity_type}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {ev.metadata && typeof ev.metadata === "object"
                ? Object.entries(ev.metadata)
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" · ")
                : "—"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end text-[11px] text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{ev.user_id?.slice(0, 8) ?? "sistema"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                new Date(ev.created_at),
              )}
            </p>
          </div>
        </div>
      )}
    />
  );
}
