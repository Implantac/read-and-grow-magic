import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Textarea } from "@/ui/base/textarea";
import { Input } from "@/ui/base/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/ui/base/dialog";
import { CheckCircle2, XCircle, UserCheck2, Loader2, Inbox, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from '@/shared/components/EmptyState';

type Approval = {
  id: string;
  instance_id: string;
  step_key: string;
  approver_id: string;
  delegated_to: string | null;
  status: string;
  due_at: string | null;
  created_at: string;
  required: boolean;
};

type Decision = "approve" | "reject" | "delegate";

export default function MyApprovals() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const qc = useQueryClient();
  const [active, setActive] = useState<{ approval: Approval; decision: Decision } | null>(null);
  const [comment, setComment] = useState("");
  const [delegateTo, setDelegateTo] = useState("");

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["my-approvals", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_my_pending_approvals");
      if (error) throw error;
      return (data ?? []) as Approval[];
    },
  });

  // realtime refresh
  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`my-approvals-${companyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workflow_approvals", filter: `company_id=eq.${companyId}` },
        () => qc.invalidateQueries({ queryKey: ["my-approvals"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, qc]);

  const decide = useMutation({
    mutationFn: async () => {
      if (!active) return;
      const { error } = await supabase.rpc("fn_workflow_decide", {
        _approval_id: active.approval.id,
        _decision: active.decision,
        _comment: comment || null,
        _delegate_to: active.decision === "delegate" ? delegateTo || null : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Decisão registrada");
      qc.invalidateQueries({ queryKey: ["my-approvals"] });
      setActive(null);
      setComment("");
      setDelegateTo("");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar decisão"),
  });

  const grouped = useMemo(() => approvals, [approvals]);

  return (
    <PageContainer>
      <PageHeader
        title="Minhas Aprovações"
        description="Aprovações paralelas e delegações pendentes"
        icon={Inbox}
      />

      {isLoading ? (
        <div className="flex justify-center py-12" role="status" aria-live="polite" aria-label="Carregando aprovações">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Carregando aprovações…</span>
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground" role="status">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary/60" aria-hidden="true" />
            Nenhuma aprovação pendente
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid gap-3"
          role="list"
          aria-label={`${grouped.length} aprovações pendentes`}
        >
          {grouped.map((a) => {
            const overdue = a.due_at && isPast(new Date(a.due_at));
            return (
              <Card key={a.id} role="listitem">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">
                    Etapa: <span className="font-mono text-sm">{a.step_key}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {a.delegated_to && <Badge variant="secondary">Delegada a você</Badge>}
                    {a.required ? <Badge>Obrigatória</Badge> : <Badge variant="outline">Opcional</Badge>}
                    {overdue && <Badge variant="destructive">Atrasada</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Instância: <span className="font-mono">{a.instance_id.slice(0, 8)}</span></div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Criada {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}
                      {a.due_at && <> · Prazo {format(new Date(a.due_at), "dd/MM/yyyy HH:mm")}</>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" aria-label={`Aprovar etapa ${a.step_key}`} onClick={() => { setActive({ approval: a, decision: "approve" }); setComment(""); }}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" aria-label={`Rejeitar etapa ${a.step_key}`} onClick={() => { setActive({ approval: a, decision: "reject" }); setComment(""); }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Rejeitar
                    </Button>
                    <Button size="sm" variant="outline" aria-label={`Delegar etapa ${a.step_key}`} onClick={() => { setActive({ approval: a, decision: "delegate" }); setComment(""); setDelegateTo(""); }}>
                      <UserCheck2 className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> Delegar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {active?.decision === "approve" && "Aprovar etapa"}
              {active?.decision === "reject" && "Rejeitar etapa"}
              {active?.decision === "delegate" && "Delegar aprovação"}
            </DialogTitle>
          </DialogHeader>
          {active?.decision === "delegate" && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ID do usuário destinatário</label>
              <Input value={delegateTo} onChange={(e) => setDelegateTo(e.target.value)} placeholder="uuid do usuário" />
            </div>
          )}
          <Textarea
            placeholder={active?.decision === "reject" ? "Motivo da rejeição (recomendado)" : "Comentário (opcional)"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Cancelar</Button>
            <Button
              disabled={decide.isPending || (active?.decision === "delegate" && !delegateTo)}
              onClick={() => decide.mutate()}
            >
              {decide.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
