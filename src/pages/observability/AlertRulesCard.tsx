import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Switch } from "@/ui/base/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/base/dialog";
import { Bell, Loader2, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AlertRule } from "./types";

const empty = {
  name: "", source: "",
  min_severity: "error" as AlertRule["min_severity"],
  threshold: 5, window_minutes: 5,
  incident_severity: "major" as AlertRule["incident_severity"],
};

export function AlertRulesCard({
  rules, loading, onCreate, onToggle, onDelete, creating,
}: {
  rules: AlertRule[]; loading: boolean;
  onCreate: (r: typeof empty) => void;
  onToggle: (a: { id: string; enabled: boolean }) => void;
  onDelete: (id: string) => void;
  creating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" /> Regras de alerta automático
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Nova regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova regra de alerta</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome (ex: Picos de erro em fiscal-transmitter)"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Fonte (opcional, ex: fiscal-transmitter)"
                value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Severidade mínima</label>
                  <Select value={form.min_severity} onValueChange={(v) => setForm({ ...form, min_severity: v as AlertRule["min_severity"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Severidade do incidente</label>
                  <Select value={form.incident_severity} onValueChange={(v) => setForm({ ...form, incident_severity: v as AlertRule["incident_severity"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Menor</SelectItem>
                      <SelectItem value="major">Maior</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Limite (eventos)</label>
                  <Input type="number" min={1} value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: Math.max(1, Number(e.target.value) || 1) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Janela (minutos)</label>
                  <Input type="number" min={1} value={form.window_minutes}
                    onChange={(e) => setForm({ ...form, window_minutes: Math.max(1, Number(e.target.value) || 1) })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button disabled={!form.name || creating} onClick={() => {
                onCreate(form);
                setForm(empty);
                setOpen(false);
              }}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma regra configurada. Crie uma para abrir incidentes automaticamente quando picos de erro acontecerem.
          </p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="border rounded-md p-3 flex items-center gap-3 text-sm">
                <Switch checked={r.enabled} onCheckedChange={(v) => onToggle({ id: r.id, enabled: v })} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.source ? <>fonte <code>{r.source}</code> · </> : "qualquer fonte · "}
                    ≥ {r.threshold} eventos <Badge variant="outline" className="ml-1">{r.min_severity}+</Badge>{" "}
                    em {r.window_minutes} min → incidente{" "}
                    <Badge variant={r.incident_severity === "critical" ? "destructive" : r.incident_severity === "major" ? "secondary" : "outline"}>
                      {r.incident_severity}
                    </Badge>
                    {r.last_triggered_at && (
                      <> · disparou {formatDistanceToNow(new Date(r.last_triggered_at), { addSuffix: true, locale: ptBR })}</>
                    )}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => onDelete(r.id)} title="Excluir">
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
