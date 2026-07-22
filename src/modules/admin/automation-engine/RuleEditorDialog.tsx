import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Switch } from "@/ui/base/switch";
import { Button } from "@/ui/base/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/base/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/base/tabs";
import { Plus, Trash2 } from "lucide-react";
import type { AutomationAction, AutomationCondition } from "@/hooks/useAutomationEngine";
import { ACTION_TYPES, OPERATORS, TRIGGER_EVENTS, type FormState } from "./constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  workflowDefs: any[];
  onSubmit: () => void;
}

export function RuleEditorDialog({ open, onOpenChange, form, setForm, workflowDefs, onSubmit }: Props) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onSubmit}
            disabled={!form.name || !form.trigger_event || form.actions.length === 0}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
