import { useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/ui/base/dialog";
import { Plus, Trash2, Play, GitBranch } from "lucide-react";
import {
  useWorkflowDefinitions,
  useWorkflowInstances,
  useWorkflowMutations,
  type WorkflowStep,
} from "@/hooks/useWorkflowEngine";

function StepEditor({ steps, setSteps }: { steps: WorkflowStep[]; setSteps: (s: WorkflowStep[]) => void }) {
  const update = (i: number, patch: Partial<WorkflowStep>) => {
    const next = [...steps];
    next[i] = { ...next[i], ...patch };
    setSteps(next);
  };
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 p-2 border rounded">
          <Input className="col-span-3" placeholder="key" value={s.key} onChange={(e) => update(i, { key: e.target.value })} />
          <Input className="col-span-3" placeholder="Rótulo" value={s.label} onChange={(e) => update(i, { label: e.target.value })} />
          <Input className="col-span-2" placeholder="Tipo" value={s.type ?? "task"} onChange={(e) => update(i, { type: e.target.value as any })} />
          <Input className="col-span-2" placeholder="Papel" value={s.assignee_role ?? ""} onChange={(e) => update(i, { assignee_role: e.target.value })} />
          <Input className="col-span-1" placeholder="Próx." value={s.next ?? ""} onChange={(e) => update(i, { next: e.target.value })} />
          <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setSteps([...steps, { key: "", label: "", type: "task" }])}>
        <Plus className="h-4 w-4 mr-1" /> Adicionar etapa
      </Button>
    </div>
  );
}

export default function WorkflowEngine() {
  const { data: defs = [], isLoading } = useWorkflowDefinitions();
  const { data: instances = [] } = useWorkflowInstances();
  const { saveDefinition, remove, startInstance } = useWorkflowMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", target_entity: "", steps: [] as WorkflowStep[] });

  const submit = async () => {
    await saveDefinition.mutateAsync(form);
    setOpen(false);
    setForm({ name: "", description: "", target_entity: "", steps: [] });
  };

  return (
    <PageContainer>
      <PageHeader title="Workflow Engine" description="Defina fluxos de aprovação e execução sem código" icon={GitBranch} />
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo Workflow</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Novo Workflow</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Entidade alvo</Label><Input value={form.target_entity} onChange={(e) => setForm({ ...form, target_entity: e.target.value })} placeholder="ex: orders, purchase_orders" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Etapas</Label><StepEditor steps={form.steps} setSteps={(s) => setForm({ ...form, steps: s })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={!form.name || !form.target_entity}>Salvar</Button></DialogFooter>
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
                    <p className="text-xs text-muted-foreground">{(d.steps as any[]).length} etapas · v{d.version}</p>
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
        <CardHeader><CardTitle>Instâncias em execução ({instances.length})</CardTitle></CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma instância ativa.</p>
          ) : (
            <div className="space-y-2">
              {instances.slice(0, 20).map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div>
                    <Badge variant={i.status === "completed" ? "default" : "secondary"}>{i.status}</Badge>
                    <span className="ml-2">Etapa: <code>{i.current_step ?? "—"}</code></span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
