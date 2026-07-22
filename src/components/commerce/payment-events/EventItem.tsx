import { ShieldAlert } from "lucide-react";
import { Badge } from "@/ui/base/badge";

interface Event {
  id: string;
  provider: string;
  order_id: string | null;
  external_id: string | null;
  event_type: string;
  status_before: string | null;
  status_after: string | null;
  signature_valid: boolean | null;
  created_at: string;
}

export function EventItem({ event, orderNumber }: { event: Event; orderNumber?: string | null }) {
  return (
    <div className="rounded border p-2.5 text-xs space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">{event.provider}</Badge>
          {orderNumber && <code className="text-[10px] text-muted-foreground">{orderNumber}</code>}
        </div>
        <span className="text-muted-foreground text-[10px]">
          {new Date(event.created_at).toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="font-medium">{event.event_type}</div>
      <div className="flex items-center gap-1 text-muted-foreground flex-wrap">
        {event.status_before && (
          <>
            <Badge variant="outline" className="text-[10px]">{event.status_before}</Badge>
            <span>→</span>
          </>
        )}
        <Badge variant={event.status_after === "paid" ? "default" : "outline"} className="text-[10px]">
          {event.status_after ?? "—"}
        </Badge>
        {event.signature_valid === false && (
          <span className="ml-auto flex items-center gap-1 text-destructive">
            <ShieldAlert className="h-3 w-3" /> assinatura inválida
          </span>
        )}
      </div>
      {event.external_id && (
        <div className="text-[10px] text-muted-foreground font-mono truncate">ext: {event.external_id}</div>
      )}
    </div>
  );
}
