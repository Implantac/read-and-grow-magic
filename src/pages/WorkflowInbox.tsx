import { useEffect, useMemo, useState } from "react";
import { useWorkflowDefinitions, useWorkflowInstances, useWorkflowMutations, type WorkflowStep } from "@/hooks/useWorkflowEngine";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Textarea } from "@/ui/base/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/base/dialog";
import { Loader2, Inbox, ArrowRight, CheckCircle2, Network } from "lucide-react";
import { format } from "date-fns";
import { WorkflowGraph } from "@/components/workflow/WorkflowGraph";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";

export default function WorkflowInbox() {
  const { data: defs = [], isLoading: loadingDefs } = useWorkflowDefinitions();
  const { data: instances = [], isLoading: loadingInstances } = useWorkflowInstances();
  const { advance } = useWorkflowMutations();
  const [target, setTarget] = useState<{ instanceId: string; toStep: string; complete: boolean } | null>(null);
  const [comment, setComment] = useState("");
  const [graphFor, setGraphFor] = useState<string | null>(null);
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);

  // Realtime: refresh instances on any update in this tenant
  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`wf-inbox-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workflow_instances", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["workflow_instances"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, qc]);

  const defMap = useMemo(() => {
    const m = new Map<string, { name: string; steps: WorkflowStep[] }>();
    defs.forEach((d) => m.set(d.id, { name: d.name, steps: (d.steps as WorkflowStep[]) ?? [] }));
    return m;
  }, [defs]);

  const pending = instances.filter((i) => i.status === "running");

  const loading = loadingDefs || loadingInstances;

  return (
    <PageContainer>
      <PageHeader title="Caixa de Workflows" description="Instâncias pendentes aguardando ação" icon={Inbox} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary/60" />
            Nenhum workflow pendente
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending.map((inst) => {
            const def = defMap.get(inst.definition_id);
            const steps = def?.steps ?? [];
            const current = steps.find((s) => s.key === inst.current_step);
            const nextKey = current?.next ?? null;
            const next = nextKey ? steps.find((s) => s.key === nextKey) : null;
            const isLast = !nextKey;

            return (
              <Card key={inst.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">
                    {def?.name ?? "Workflow"}{" "}
                    <span className="text-xs text-muted-foreground font-normal">#{inst.id.slice(0, 8)}</span>
                  </CardTitle>
                  <Badge variant="secondary">{inst.target_entity}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge>{current?.label ?? inst.current_step ?? "—"}</Badge>
                    {next && (
                      <>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant="outline">{next.label}</Badge>
                      </>
                    )}
                    {current?.assignee_role && (
                      <span className="text-xs text-muted-foreground ml-2">Responsável: {current.assignee_role}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Iniciado em {format(new Date(inst.created_at), "dd/MM/yyyy HH:mm")}
                  </div>
                  <div className="flex gap-2">
                    {next && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setTarget({ instanceId: inst.id, toStep: next.key, complete: false });
                          setComment("");
                        }}
                      >
                        Avançar para {next.label}
                      </Button>
                    )}
                    {isLast && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setTarget({ instanceId: inst.id, toStep: inst.current_step ?? "done", complete: true });
                          setComment("");
                        }}
                      >
                        Concluir workflow
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setGraphFor(inst.id)}>
                      <Network className="h-3.5 w-3.5 mr-1" /> Ver fluxo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target?.complete ? "Concluir workflow" : "Avançar etapa"}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={advance.isPending}
              onClick={async () => {
                if (!target) return;
                await advance.mutateAsync({
                  instance_id: target.instanceId,
                  to_step: target.toStep,
                  comment: comment || undefined,
                  complete: target.complete,
                });
                setTarget(null);
              }}
            >
              {advance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
