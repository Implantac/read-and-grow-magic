import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import { Switch } from "@/ui/base/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/ui/base/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import { Plus, Trash2, Zap, History, Edit, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  useAutomationRules,
  useAutomationRuns,
  useAutomationMutations,
  type AutomationAction,
  type AutomationCondition,
  type AutomationRule,
} from "@/hooks/useAutomationEngine";
import { useWorkflowDefinitions } from "@/hooks/useWorkflowEngine";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const TRIGGER_EVENTS = [
  { value: "order.created", label: "Pedido criado" },
  { value: "order.status_changed", label: "Pedido — status alterado" },
  { value: "order.updated", label: "Pedido atualizado" },
  { value: "accounts_payable.created", label: "Conta a pagar criada" },
  { value: "accounts_payable.status_changed", label: "Conta a pagar — status alterado" },
  { value: "accounts_receivable.created", label: "Conta a receber criada" },
  { value: "accounts_receivable.status_changed", label: "Conta a receber — status alterado" },
  { value: "production_order.created", label: "Ordem de produção criada" },
  { value: "production_order.status_changed", label: "OP — status alterado" },
  { value: "nfe.created", label: "NF-e criada" },
  { value: "nfe.status_changed", label: "NF-e — status alterado" },
];

const ACTION_TYPES = [
  { value: "notification", label: "Notificação interna" },
  { value: "webhook", label: "Webhook HTTP" },
  { value: "log", label: "Registrar em log" },
  { value: "start_workflow", label: "Iniciar workflow" },
];

const OPERATORS = [
  { value: "eq", label: "= igual" },
  { value: "neq", label: "≠ diferente" },
  { value: "gt", label: "> maior" },
  { value: "lt", label: "< menor" },
  { value: "contains", label: "contém" },
];

type FormState = {
  id?: string;
  name: string;
  description: string;
  trigger_event: string;
  is_active: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  trigger_event: "",
  is_active: true,
  conditions: [],
  actions: [{ type: "notification", config: { title: "", message: "" } }],
};

export default function AutomationEngine() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const { data: workflowDefs = [] } = useWorkflowDefinitions();
  const { save, remove, toggle } = useAutomationMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [historyRuleId, setHistoryRuleId] = useState<string | null>(null);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (r: AutomationRule) => {
    setForm({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      trigger_event: r.trigger_event,
      is_active: r.is_active,
      conditions: (r.conditions as AutomationCondition[]) ?? [],
      actions: (r.actions as AutomationAction[]) ?? [],
    });
    setOpen(true);
  };

  const submit = async () => {
    await save.mutateAsync({
      id: form.id,
      name: form.name,
      description: form.description,
      trigger_event: form.trigger_event,
      conditions: form.conditions,
      actions: form.actions,
      is_active: form.is_active,
    });
    setOpen(false);
    setForm(EMPTY_FORM);
  };

  const addCondition = () =>
    setForm((f) => ({ ...f, conditions: [...f.conditions, { field: "", operator: "eq", value: "" }] }));
  const removeCondition = (i: number) =>
    setForm((f) => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));
  const updateCondition = (i: number, patch: Partial<AutomationCondition>) =>
    setForm((f) => ({
      ...f,
      conditions: f.conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }));

  const addAction = () =>
    setForm((f) => ({ ...f, actions: [...f.actions, { type: "log", config: {} }] }));
  const removeAction = (i: number) =>
    setForm((f) => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));
  const updateAction = (i: number, patch: Partial<AutomationAction>) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));
  const updateActionConfig = (i: number, key: string, value: any) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, idx) =>
        idx === i ? { ...a, config: { ...a.config, [key]: value } } : a,
      ),
    }));

  return (
    <PageContainer>
      <PageHeader
        title="Automation Engine"
        description="Crie gatilhos e ações automáticas declarativas"
        icon={Zap}
      />
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : rules.length === 0 ? (
            <EmptyState
              compact
              icon={Zap}
              title="Nenhuma regra configurada"
              description="Crie regras para automatizar ações a partir de eventos do ERP."
            />
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      {r.name}
                      <Badge variant="outline">{r.trigger_event}</Badge>
                      {!r.is_active && <Badge variant="secondary">Inativa</Badge>}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {(r.actions as any[]).length} ação(ões) ·{" "}
                      {(r.conditions as any[]).length} condição(ões)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => setHistoryRuleId(r.id)}>
                      <History className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Excluir regra "${r.name}"?`)) remove.mutate(r.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar Regra" : "Nova Regra"} de Automação</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="conditions">Condições ({form.conditions.length})</TabsTrigger>
              <TabsTrigger value="actions">Ações ({form.actions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 pt-3">
              <div>
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Evento gatilho</Label>
                <Select
                  value={form.trigger_event}
                  onValueChange={(v) => setForm({ ...form, trigger_event: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label} <span className="text-muted-foreground text-xs ml-2">{e.value}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Ativa</Label>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                A regra só executa se TODAS as condições forem verdadeiras no payload do evento.
                Deixe vazio para executar sempre.
              </p>
              {form.conditions.map((c, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Campo</Label>
                    <Input
                      placeholder="ex: status, total"
                      value={c.field}
                      onChange={(e) => updateCondition(i, { field: e.target.value })}
                    />
                  </div>
                  <div className="w-36">
                    <Label className="text-xs">Operador</Label>
                    <Select
                      value={c.operator}
                      onValueChange={(v) => updateCondition(i, { operator: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Valor</Label>
                    <Input
                      value={String(c.value ?? "")}
                      onChange={(e) => updateCondition(i, { value: e.target.value })}
                    />
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeCondition(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar condição
              </Button>
            </TabsContent>

            <TabsContent value="actions" className="space-y-3 pt-3">
              {form.actions.map((a, i) => (
                <div key={i} className="border rounded p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <Select value={a.type} onValueChange={(v) => updateAction(i, { type: v as any, config: {} })}>
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex-1" />
                    <Button size="icon" variant="ghost" onClick={() => removeAction(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {a.type === "notification" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Título</Label>
                        <Input
                          value={a.config.title ?? ""}
                          onChange={(e) => updateActionConfig(i, "title", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Mensagem</Label>
                        <Input
                          value={a.config.message ?? ""}
                          onChange={(e) => updateActionConfig(i, "message", e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {a.type === "webhook" && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input
                          placeholder="https://..."
                          value={a.config.url ?? ""}
                          onChange={(e) => updateActionConfig(i, "url", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Headers (JSON opcional)</Label>
                        <Textarea
                          rows={2}
                          className="font-mono text-xs"
                          placeholder='{"Authorization":"Bearer ..."}'
                          value={a.config.headers ?? ""}
                          onChange={(e) => updateActionConfig(i, "headers", e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {a.type === "log" && (
                    <div>
                      <Label className="text-xs">Mensagem de log</Label>
                      <Input
                        value={a.config.message ?? ""}
                        onChange={(e) => updateActionConfig(i, "message", e.target.value)}
                      />
                    </div>
                  )}

                  {a.type === "start_workflow" && (
                    <div>
                      <Label className="text-xs">Workflow</Label>
                      <Select
                        value={a.config.definition_id ?? ""}
                        onValueChange={(v) => updateActionConfig(i, "definition_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um workflow" />
                        </SelectTrigger>
                        <SelectContent>
                          {workflowDefs.length === 0 ? (
                            <SelectItem value="__none" disabled>Nenhum workflow disponível</SelectItem>
                          ) : (
                            workflowDefs.map((d: any) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name} <span className="text-muted-foreground ml-2">({d.target_entity})</span>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Uma instância será iniciada usando o contexto do evento como dados de entrada.
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar ação
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              onClick={submit}
              disabled={!form.name || !form.trigger_event || form.actions.length === 0}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Run history */}
      <RunsDialog ruleId={historyRuleId} onClose={() => setHistoryRuleId(null)} />
    </PageContainer>
  );
}

function RunsDialog({ ruleId, onClose }: { ruleId: string | null; onClose: () => void }) {
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
