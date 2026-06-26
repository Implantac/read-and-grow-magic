import { useWorkflowHistory } from "@/hooks/useWorkflowEngine";
import { Badge } from "@/ui/base/badge";
import { ScrollArea } from "@/ui/base/scroll-area";
import { ArrowRight, Clock } from "lucide-react";

export function WorkflowHistory({ instanceId }: { instanceId: string }) {
  const { data: events = [], isLoading } = useWorkflowHistory(instanceId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando histórico…</p>;
  }
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem transições registradas.</p>;
  }

  return (
    <ScrollArea className="max-h-[60vh] pr-3">
      <ol className="relative border-l border-border ml-2 space-y-3">
        {events.map((e) => (
          <li key={e.id} className="ml-4">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(e.created_at).toLocaleString("pt-BR")}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <Badge variant="outline">{e.from_step ?? "início"}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge>{e.to_step}</Badge>
            </div>
            {e.comment && (
              <p className="text-xs text-muted-foreground mt-1 italic">{e.comment}</p>
            )}
            {e.payload && Object.keys(e.payload).length > 0 && (
              <pre className="text-[10px] mt-1 bg-muted/40 rounded p-2 overflow-x-auto">
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ol>
    </ScrollArea>
  );
}
