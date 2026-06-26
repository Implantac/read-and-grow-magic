import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/ui/base/dialog";
import { Plus, Trash2, Play, GitBranch, History, GitFork } from "lucide-react";
import {
  useWorkflowDefinitions,
  useWorkflowInstances,
  useWorkflowMutations,
  type WorkflowStep,
} from "@/hooks/useWorkflowEngine";
import { safeParseJson, type Branch } from "@/lib/workflowConditions";
import { WorkflowHistory } from "@/components/workflow/WorkflowHistory";
import { toSafeNumber } from "@/lib/numericValidation";

function BranchEditor({
  branches,
  onChange,
}: {
  branches: Branch[];
  onChange: (b: Branch[]) => void;
}) {
  const update = (i: number, patch: Partial<Branch>) => {
    const next = [...branches];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  return (
    <div className="space-y-2 pl-4 border-l-2 border-primary/30">
      {branches.map((br, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start">
          <Textarea
            className="col-span-7 text-xs font-mono"
            rows={2}
            placeholder='{"==": [{"var":"amount"}, 1000]}'
            value={typeof br.when === "string" ? br.when : JSON.stringify(br.when)}
            onChange={(e) => {
              const parsed = safeParseJson(e.target.value);
              update(i, { when: parsed ?? e.target.value });
            }}
          />
          <Input
            className="col-span-3"
            placeholder="próx. step"
            value={br.next}
            onChange={(e) => update(i, { next: e.target.value })}
          />
          <Input
            className="col-span-1"
            placeholder="rótulo"
            value={br.label ?? ""}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <Button
            variant="ghost"
            size="icon"
            className="col-span-1"
            onClick={() => onChange(branches.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...branches, { when: {}, next: "" }])}
      >
        <GitFork className="h-3 w-3 mr-1" /> Adicionar condição
      </Button>
    </div>
  );
}

function StepEditor({
  steps,
  setSteps,
}: {
  steps: WorkflowStep[];
  setSteps: (s: WorkflowStep[]) => void;
}) {
  const update = (i: number, patch: Partial<WorkflowStep>) => {
    const next = [...steps];
    next[i] = { ...next[i], ...patch };
    setSteps(next);
  };
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="p-3 border rounded space-y-2 bg-card/50">
          <div className="grid grid-cols-12 gap-2">
            <Input className="col-span-3" placeholder="key" value={s.key} onChange={(e) => update(i, { key: e.target.value })} />
            <Input className="col-span-3" placeholder="Rótulo" value={s.label} onChange={(e) => update(i, { label: e.target.value })} />
            <Input className="col-span-2" placeholder="Tipo" value={s.type ?? "task"} onChange={(e) => update(i, { type: e.target.value as WorkflowStep["type"] })} />
            <Input className="col-span-2" placeholder="Papel" value={s.assignee_role ?? ""} onChange={(e) => update(i, { assignee_role: e.target.value })} />
            <Input className="col-span-1" placeholder="SLA h" type="number" value={s.sla_hours ?? ""} onChange={(e) => update(i, { sla_hours: toSafeNumber(e.target.value, 0, { integer: true, min: 0 }) || undefined })} />
            <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-12 gap-2 items-center">
            <Label className="col-span-2 text-xs">Próx. padrão</Label>
            <Input className="col-span-4" placeholder="step.key" value={s.next ?? ""} onChange={(e) => update(i, { next: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><GitFork className="h-3 w-3" /> Branches condicionais (JsonLogic-like)</Label>
            <BranchEditor branches={s.branches ?? []} onChange={(b) => update(i, { branches: b })} />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setSteps([...steps, { key: "", label: "", type: "task", branches: [] }])}>
        <Plus className="h-4 w-4 mr-1" /> Adicionar etapa
      </Button>
    </div>
  );
}

export default function WorkflowEngine() {
  const { data: defs = [], isLoading } = useWorkflowDefinitions();
  const { data: instances = [] } = useWorkflowInstances();
  const { saveDefinition, remove, startInstance, advance } = useWorkflowMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    target_entity: "",
    steps: [] as WorkflowStep[],
  });
  const [historyInstanceId, setHistoryInstanceId] = useState<string | null>(null);

  const submit = async () => {
    await saveDefinition.mutateAsync(form);
    setOpen(false);
    setForm({ name: "", description: "", target_entity: "", steps: [] });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Workflow Engine v2"
        description="Fluxos com etapas condicionais, SLA por etapa e histórico de execuções"
        icon={GitBranch}
      />
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo Workflow</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Workflow</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Entidade alvo</Label><Input value={form.target_entity} onChange={(e) => setForm({ ...form, target_entity: e.target.value })} placeholder="ex: orders, purchase_orders" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Etapas</Label><StepEditor steps={form.steps} setSteps={(s) => setForm({ ...form, steps: s })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={!form.name || !form.target_entity}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Definições ({defs.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> : defs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum workflow definido.</p>
          ) : (
            <div className="space-y-2">
              {defs.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{d.name} <Badge variant="outline" className="ml-2">{d.target_entity}</Badge></div>
                    <p className="text-xs text-muted-foreground">{(d.steps as unknown as WorkflowStep[]).length} etapas · v{d.version}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startInstance.mutate({ definition_id: d.id })}>
                      <Play className="h-4 w-4 mr-1" /> Iniciar
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Instâncias ({instances.length})</CardTitle></CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma instância ativa.</p>
          ) : (
            <div className="space-y-2">
              {instances.slice(0, 30).map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={i.status === "completed" ? "default" : "secondary"}>{i.status}</Badge>
                    <span>Etapa: <code className="text-xs">{i.current_step ?? "—"}</code></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.status === "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => advance.mutate({ instance_id: i.id })}
                      >
                        Avançar (auto)
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setHistoryInstanceId(i.id)}>
                      <History className="h-4 w-4 mr-1" /> Histórico
                    </Button>
                    <span className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TriggersCard definitions={defs.map((d) => ({ id: d.id, name: d.name }))} />

      <Dialog open={!!historyInstanceId} onOpenChange={(o) => !o && setHistoryInstanceId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico da execução</DialogTitle></DialogHeader>
          {historyInstanceId && <WorkflowHistory instanceId={historyInstanceId} />}
        </DialogContent>
      </Dialog>

    </PageContainer>
  );
}
