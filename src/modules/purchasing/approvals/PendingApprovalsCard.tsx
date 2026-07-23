import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { AlertTriangle, CircleSlash, Timer } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  usePendingPOApprovals,
  useScanApprovalsSLA,
} from "@/hooks/purchasing/usePurchaseApprovals";
import { slaStatus } from "./utils";

type DecisionRequest = { id: string; approve: boolean };

interface Props {
  onDecide: (req: DecisionRequest) => void;
}

export function PendingApprovalsCard({ onDecide }: Props) {
  const pending = usePendingPOApprovals();
  const scanSLA = useScanApprovalsSLA();

  const items = pending.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Aprovações pendentes</CardTitle>
        <Button size="sm" variant="outline" onClick={() => scanSLA.mutate()} disabled={scanSLA.isPending}>
          <AlertTriangle className="mr-1 h-4 w-4" />
          Verificar SLA
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CircleSlash}
            title="Nenhuma aprovação pendente"
            description="Todos os pedidos dentro das alçadas estão em dia. Bom trabalho!"
          />
        ) : (
          <div className="space-y-3">
            {items.map((a: any) => {
              const sla = slaStatus(a.due_at);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Ordem {a.instance_id.slice(0, 8)}…</div>
                    <div className="text-xs text-muted-foreground">{a.step_key}</div>
                    <div className="mt-1">
                      <Badge
                        variant={
                          sla.tone === "destructive"
                            ? "destructive"
                            : sla.tone === "warning"
                            ? "secondary"
                            : sla.tone === "success"
                            ? "default"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        <Timer className="mr-1 h-3 w-3" />
                        {sla.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onDecide({ id: a.id, approve: true })}>
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDecide({ id: a.id, approve: false })}
                    >
                      <CircleSlash className="mr-1 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
