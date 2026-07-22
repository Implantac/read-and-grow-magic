import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/base/dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useAutomationRuns } from "@/hooks/useAutomationEngine";

export function RunsDialog({ ruleId, onClose }: { ruleId: string | null; onClose: () => void }) {
  const { data: runs = [], isLoading } = useAutomationRuns(ruleId ?? undefined);
  return (
    <Dialog open={!!ruleId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de execuções</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : runs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma execução registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {runs.map((r: any) => {
              const Icon =
                r.status === "success" ? CheckCircle2 : r.status === "error" ? XCircle : AlertCircle;
              const color =
                r.status === "success"
                  ? "text-emerald-500"
                  : r.status === "error"
                    ? "text-destructive"
                    : "text-amber-500";
              return (
                <div key={r.id} className="border rounded p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="font-medium capitalize">{r.status}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {r.results && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(r.results, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
