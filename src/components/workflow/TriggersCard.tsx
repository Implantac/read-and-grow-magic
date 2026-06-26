import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import { Badge } from "@/ui/base/badge";
import { Switch } from "@/ui/base/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/ui/base/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/ui/base/select";
import { Plus, Trash2, Zap } from "lucide-react";
import { useWorkflowTriggers } from "@/hooks/useWorkflowTriggers";
import { safeParseJson } from "@/lib/workflowConditions";

const KNOWN_EVENTS = [
  "order.created", "order.approved", "order.delivered",
  "ap.created", "ap.paid", "ar.created", "ar.received",
  "nfe.authorized", "stock.low", "production.completed",
];

export function TriggersCard({ definitions }: { definitions: { id: string; name: string }[] }) {
  const { triggers, isLoading, upsert, remove } = useWorkflowTriggers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    workflow_definition_id: "",
    event_type: "",
    source_module: "",
    description: "",
    condition: "{}",
    is_active: true,
  });

  const submit = async () => {
    const cond = safeParseJson(form.condition) ?? {};
    await upsert.mutateAsync({
      workflow_definition_id: form.workflow_definition_id,
      event_type: form.event_type,
      source_module: form.source_module || null,
      description: form.description || null,
      condition: cond as Record<string, unknown>,
      is_active: form.is_active,
    });
    setOpen(false);
    setForm({ workflow_definition_id: "", event_type: "", source_module: "", description: "", condition: "{}", is_active: true });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" /> Gatilhos automáticos ({triggers.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={definitions.length === 0}><Plus className="h-4 w-4 mr-1" /> Novo gatilho</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Novo gatilho cross-módulo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Workflow</Label>
                <Select value={form.workflow_definition_id} onValueChange={(v) => setForm({ ...form, workflow_definition_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {definitions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de evento</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {KNOWN_EVENTS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Módulo origem (opcional)</Label>
                <Input value={form.source_module} onChange={(e) => setForm({ ...form, source_module: e.target.value })} placeholder="ex: orders" />
              </div>
              <div>
                <Label>Condição (JsonLogic)</Label>
                <Textarea
                  rows={3}
                  className="font-mono text-xs"
                  placeholder='{">": [{"var":"total"}, 10000]}'
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={!form.workflow_definition_id || !form.event_type}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Carregando…</p>
        ) : triggers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum gatilho configurado. Eventos cross-módulo não disparam workflows automaticamente.</p>
        ) : (
          <div className="space-y-2">
            {triggers.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Ativo" : "Inativo"}</Badge>
                  <code className="text-xs">{t.event_type}</code>
                  {t.source_module && <Badge variant="outline">{t.source_module}</Badge>}
                  {t.description && <span className="text-muted-foreground">— {t.description}</span>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
