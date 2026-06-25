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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/ui/base/dialog";
import { Plus, Trash2, Zap } from "lucide-react";
import { useAutomationRules, useAutomationMutations, type AutomationAction } from "@/hooks/useAutomationEngine";

export default function AutomationEngine() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const { save, remove, toggle } = useAutomationMutations();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger_event: "",
    actions_json: '[{"type":"notify","config":{"message":"Evento disparado"}}]',
  });

  const submit = async () => {
    let actions: AutomationAction[] = [];
    try {
      actions = JSON.parse(form.actions_json);
    } catch {
      return alert("JSON de ações inválido");
    }
    await save.mutateAsync({
      name: form.name,
      description: form.description,
      trigger_event: form.trigger_event,
      actions,
    });
    setOpen(false);
    setForm({ name: "", description: "", trigger_event: "", actions_json: '[{"type":"notify","config":{"message":"Evento disparado"}}]' });
  };

  return (
    <PageContainer>
      <PageHeader title="Automation Engine" description="Crie gatilhos e ações automáticas declarativas" icon={Zap} />
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Nova Regra de Automação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Evento gatilho</Label><Input value={form.trigger_event} onChange={(e) => setForm({ ...form, trigger_event: e.target.value })} placeholder="ex: order.created, payment.failed" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Ações (JSON)</Label><Textarea rows={6} className="font-mono text-xs" value={form.actions_json} onChange={(e) => setForm({ ...form, actions_json: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={!form.name || !form.trigger_event}>Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Regras ({rules.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className="text-muted-foreground">Carregando...</p> : rules.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma regra configurada.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{r.name} <Badge variant="outline" className="ml-2">{r.trigger_event}</Badge></div>
                    <p className="text-xs text-muted-foreground">{(r.actions as any[]).length} ação(ões)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} />
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
