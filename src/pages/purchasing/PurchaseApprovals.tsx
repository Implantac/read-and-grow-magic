import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/base/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import {
  useDecidePOApproval,
  useDeletePurchaseApprovalRule,
  usePendingPOApprovals,
  usePurchaseApprovalRules,
  useUpsertPurchaseApprovalRule,
  useScanApprovalsSLA,
} from "@/hooks/purchasing/usePurchaseApprovals";
import { Trash2, ShieldCheck, CircleSlash, Timer, AlertTriangle } from "lucide-react";

function slaStatus(dueAt: string | null | undefined): { label: string; tone: "success" | "warning" | "destructive" | "muted" } {
  if (!dueAt) return { label: "Sem SLA", tone: "muted" };
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  if (now >= due) return { label: "Vencida", tone: "destructive" };
  if (due - now <= 4 * 3600 * 1000) return { label: "Em risco", tone: "warning" };
  const hours = Math.floor((due - now) / 3600000);
  return { label: `Vence em ${hours}h`, tone: "success" };
}

const formatBRL = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PurchaseApprovals() {
  const rules = usePurchaseApprovalRules();
  const pending = usePendingPOApprovals();
  const upsertRule = useUpsertPurchaseApprovalRule();
  const deleteRule = useDeletePurchaseApprovalRule();
  const decide = useDecidePOApproval();
  const scanSLA = useScanApprovalsSLA();

  const [openRule, setOpenRule] = useState(false);
  const [form, setForm] = useState({
    level: 1,
    min_amount: 0,
    max_amount: "" as string,
    approver_role: "manager",
    sla_hours: 24,
    active: true,
  });

  const [decisionOpen, setDecisionOpen] = useState<null | {
    id: string;
    approve: boolean;
  }>(null);
  const [comment, setComment] = useState("");

  const sortedRules = useMemo(
    () => (rules.data ?? []).sort((a, b) => a.level - b.level),
    [rules.data]
  );

  return (
    <PageContainer>
      <PageHeader
        title="Aprovação Hierárquica de Compras"
        description="Alçadas por valor e caixa de decisão dos aprovadores."
        icon={ShieldCheck}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alçadas por valor</CardTitle>
            <Dialog open={openRule} onOpenChange={setOpenRule}>
              <DialogTrigger asChild>
                <Button size="sm">Nova alçada</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova regra de aprovação</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Nível</Label>
                    <Input
                      type="number"
                      value={form.level}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, level: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Valor mínimo</Label>
                      <Input
                        type="number"
                        value={form.min_amount}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            min_amount: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Valor máximo (opcional)</Label>
                      <Input
                        type="number"
                        value={form.max_amount}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, max_amount: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Papel aprovador</Label>
                    <Select
                      value={form.approver_role}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, approver_role: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="admin">Diretor / Admin</SelectItem>
                        <SelectItem value="system_admin">CEO / System Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>SLA (horas)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.sla_hours}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, sla_hours: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={async () => {
                      await upsertRule.mutateAsync({
                        level: form.level,
                        min_amount: form.min_amount,
                        max_amount: form.max_amount === "" ? null : Number(form.max_amount),
                        approver_role: form.approver_role,
                        sla_hours: form.sla_hours,
                        active: true,
                      });
                      setOpenRule(false);
                    }}
                  >
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {sortedRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma alçada configurada. Adicione a primeira regra.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nível</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>L{r.level}</TableCell>
                      <TableCell>
                        {formatBRL(r.min_amount)} —{" "}
                        {r.max_amount ? formatBRL(r.max_amount) : "∞"}
                      </TableCell>
                      <TableCell>{r.approver_role}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Timer className="h-3 w-3" /> {r.sla_hours}h
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.active ? "default" : "outline"}>
                          {r.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRule.mutate(r.id)}
                          aria-label="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aprovações pendentes</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => scanSLA.mutate()}
              disabled={scanSLA.isPending}
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              Verificar SLA
            </Button>
          </CardHeader>
          <CardContent>
            {(pending.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma aprovação pendente.
              </p>
            ) : (
              <div className="space-y-3">
                {(pending.data ?? []).map((a: any) => {
                  const sla = slaStatus(a.due_at);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium">
                          Ordem {a.instance_id.slice(0, 8)}…
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.step_key}
                        </div>
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
                        <Button
                          size="sm"
                          onClick={() => {
                            setComment("");
                            setDecisionOpen({ id: a.id, approve: true });
                          }}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setComment("");
                            setDecisionOpen({ id: a.id, approve: false });
                          }}
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
      </div>

      <Dialog
        open={!!decisionOpen}
        onOpenChange={(o) => !o && setDecisionOpen(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionOpen?.approve ? "Aprovar solicitação" : "Rejeitar solicitação"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant={decisionOpen?.approve ? "default" : "destructive"}
              onClick={async () => {
                if (!decisionOpen) return;
                await decide.mutateAsync({
                  approvalId: decisionOpen.id,
                  approve: decisionOpen.approve,
                  comment,
                });
                setDecisionOpen(null);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
