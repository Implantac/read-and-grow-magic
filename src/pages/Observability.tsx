import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEnterpriseStore } from "@/core/stores/useEnterpriseStore";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Textarea } from "@/ui/base/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/ui/base/dialog";
import {
  Activity, AlertTriangle, AlertCircle, Info, ShieldAlert,
  Plus, RefreshCw, Loader2, Bell, Trash2, Power,
} from "lucide-react";
import { Switch } from "@/ui/base/switch";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type Health = {
  events: { critical: number; error: number; warning: number; info: number; total: number };
  incidents: { open: number; mitigating: number; resolved_24h: number };
  generated_at: string;
};

type Event = {
  id: string;
  occurred_at: string;
  source: string;
  event_type: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  message: string;
  context: Record<string, unknown>;
};

type Incident = {
  id: string;
  title: string;
  description: string | null;
  severity: "minor" | "major" | "critical";
  status: "open" | "mitigating" | "resolved";
  source: string | null;
  opened_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
};

type AlertRule = {
  id: string;
  name: string;
  source: string | null;
  min_severity: "info" | "warning" | "error" | "critical";
  threshold: number;
  window_minutes: number;
  incident_severity: "minor" | "major" | "critical";
  enabled: boolean;
  last_triggered_at: string | null;
};

const sevColor: Record<string, string> = {
  critical: "destructive",
  error: "destructive",
  warning: "secondary",
  info: "outline",
  debug: "outline",
};

const sevIcon = (s: string) => {
  if (s === "critical") return <ShieldAlert className="h-3.5 w-3.5" />;
  if (s === "error") return <AlertCircle className="h-3.5 w-3.5" />;
  if (s === "warning") return <AlertTriangle className="h-3.5 w-3.5" />;
  return <Info className="h-3.5 w-3.5" />;
};

export default function Observability() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  const qc = useQueryClient();
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", severity: "minor" as Incident["severity"] });
  const [ruleOpen, setRuleOpen] = useState(false);
  const emptyRule = { name: "", source: "", min_severity: "error" as AlertRule["min_severity"], threshold: 5, window_minutes: 5, incident_severity: "major" as AlertRule["incident_severity"] };
  const [ruleForm, setRuleForm] = useState(emptyRule);

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ["tenant_health", companyId],
    enabled: !!companyId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_tenant_health");
      if (error) throw error;
      return data as unknown as Health;
    },
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["system_events", companyId, sevFilter],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase
        .from("system_events")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(50);
      if (sevFilter !== "all") q = q.eq("severity", sevFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Event[];
    },
  });

  const { data: incidents = [], isLoading: loadingInc } = useQuery({
    queryKey: ["system_incidents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_incidents")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Incident[];
    },
  });

  useEffect(() => {
    if (!companyId) return;
    const ch = supabase
      .channel(`obs-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "system_events", filter: `company_id=eq.${companyId}` },
        () => { qc.invalidateQueries({ queryKey: ["system_events"] }); qc.invalidateQueries({ queryKey: ["tenant_health"] }); })
      .on("postgres_changes", { event: "*", schema: "public", table: "system_incidents", filter: `company_id=eq.${companyId}` },
        () => { qc.invalidateQueries({ queryKey: ["system_incidents"] }); qc.invalidateQueries({ queryKey: ["tenant_health"] }); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, qc]);

  const createIncident = useMutation({
    mutationFn: async () => {
      if (!companyId) return;
      const { error } = await supabase.from("system_incidents").insert({
        company_id: companyId,
        title: form.title,
        description: form.description || null,
        severity: form.severity,
        status: "open",
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Incidente registrado");
      setForm({ title: "", description: "", severity: "minor" });
      setNewOpen(false);
      qc.invalidateQueries({ queryKey: ["system_incidents"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Incident["status"]; notes?: string }) => {
      const patch: { status: Incident["status"]; acknowledged_at?: string; resolved_at?: string; resolution_notes?: string } = { status };
      if (status === "mitigating") patch.acknowledged_at = new Date().toISOString();
      if (status === "resolved") {
        patch.resolved_at = new Date().toISOString();
        if (notes) patch.resolution_notes = notes;
      }
      const { error } = await supabase.from("system_incidents").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system_incidents"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["alert_rules", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_rules").select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AlertRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async () => {
      if (!companyId) return;
      const { error } = await supabase.from("alert_rules").insert({
        company_id: companyId,
        name: ruleForm.name,
        source: ruleForm.source.trim() || null,
        min_severity: ruleForm.min_severity,
        threshold: ruleForm.threshold,
        window_minutes: ruleForm.window_minutes,
        incident_severity: ruleForm.incident_severity,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra de alerta criada");
      setRuleForm(emptyRule);
      setRuleOpen(false);
      qc.invalidateQueries({ queryKey: ["alert_rules"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("alert_rules").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert_rules"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alert_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert_rules"] }),
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });


  const kpis = useMemo(() => {
    const ev = health?.events ?? { critical: 0, error: 0, warning: 0, info: 0, total: 0 };
    const inc = health?.incidents ?? { open: 0, mitigating: 0, resolved_24h: 0 };
    return [
      { label: "Críticos (24h)", value: ev.critical, accent: "text-red-500" },
      { label: "Erros (24h)", value: ev.error, accent: "text-orange-500" },
      { label: "Avisos (24h)", value: ev.warning, accent: "text-yellow-500" },
      { label: "Incidentes abertos", value: inc.open + inc.mitigating, accent: "text-primary" },
    ];
  }, [health]);

  return (
    <PageContainer>
      <PageHeader
        title="Observabilidade & SRE"
        description="Saúde da plataforma, eventos e incidentes deste tenant"
        icon={Activity}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["tenant_health"] })}>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo incidente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Abrir incidente</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <Textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as Incident["severity"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Menor</SelectItem>
                      <SelectItem value="major">Maior</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
                  <Button disabled={!form.title || createIncident.isPending} onClick={() => createIncident.mutate()}>
                    {createIncident.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 md:grid-cols-4 mb-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className={`text-2xl font-semibold ${k.accent}`}>{loadingHealth ? "…" : k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Eventos recentes</CardTitle>
            <Select value={sevFilter} onValueChange={setSevFilter}>
              <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas severidades</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {loadingEvents ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem eventos no período.</p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="border rounded-md p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={sevColor[e.severity] as any} className="gap-1">
                        {sevIcon(e.severity)} {e.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{e.source}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(e.occurred_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <div className="mt-1">{e.message}</div>
                    {Object.keys(e.context ?? {}).length > 0 && (
                      <pre className="mt-1 text-[10px] text-muted-foreground bg-muted/40 p-1 rounded overflow-x-auto">
{JSON.stringify(e.context, null, 0)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card>
          <CardHeader><CardTitle className="text-base">Incidentes</CardTitle></CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {loadingInc ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum incidente.</p>
            ) : (
              <div className="space-y-2">
                {incidents.map((i) => (
                  <div key={i.id} className="border rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{i.title}</div>
                      <div className="flex gap-1">
                        <Badge variant={i.severity === "critical" ? "destructive" : i.severity === "major" ? "secondary" : "outline"}>
                          {i.severity}
                        </Badge>
                        <Badge variant={i.status === "open" ? "destructive" : i.status === "mitigating" ? "secondary" : "outline"}>
                          {i.status}
                        </Badge>
                      </div>
                    </div>
                    {i.description && <div className="text-xs text-muted-foreground mt-1">{i.description}</div>}
                    <div className="text-xs text-muted-foreground mt-1">
                      Aberto em {format(new Date(i.opened_at), "dd/MM/yyyy HH:mm")}
                      {i.resolved_at && <> · Resolvido em {format(new Date(i.resolved_at), "dd/MM/yyyy HH:mm")}</>}
                    </div>
                    {i.status !== "resolved" && (
                      <div className="flex gap-2 mt-2">
                        {i.status === "open" && (
                          <Button size="sm" variant="secondary"
                            onClick={() => updateStatus.mutate({ id: i.id, status: "mitigating" })}>
                            Iniciar mitigação
                          </Button>
                        )}
                        <Button size="sm"
                          onClick={() => updateStatus.mutate({ id: i.id, status: "resolved" })}>
                          Resolver
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert rules */}
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Regras de alerta automático
          </CardTitle>
          <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Nova regra</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova regra de alerta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nome (ex: Picos de erro em fiscal-transmitter)"
                  value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
                <Input placeholder="Fonte (opcional, ex: fiscal-transmitter)"
                  value={ruleForm.source} onChange={(e) => setRuleForm({ ...ruleForm, source: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Severidade mínima</label>
                    <Select value={ruleForm.min_severity} onValueChange={(v) => setRuleForm({ ...ruleForm, min_severity: v as AlertRule["min_severity"] })}>
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
                    <Select value={ruleForm.incident_severity} onValueChange={(v) => setRuleForm({ ...ruleForm, incident_severity: v as AlertRule["incident_severity"] })}>
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
                    <Input type="number" min={1} value={ruleForm.threshold}
                      onChange={(e) => setRuleForm({ ...ruleForm, threshold: Math.max(1, Number(e.target.value) || 1) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Janela (minutos)</label>
                    <Input type="number" min={1} value={ruleForm.window_minutes}
                      onChange={(e) => setRuleForm({ ...ruleForm, window_minutes: Math.max(1, Number(e.target.value) || 1) })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRuleOpen(false)}>Cancelar</Button>
                <Button disabled={!ruleForm.name || createRule.isPending} onClick={() => createRule.mutate()}>
                  {createRule.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingRules ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma regra configurada. Crie uma para abrir incidentes automaticamente quando picos de erro acontecerem.
            </p>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <div key={r.id} className="border rounded-md p-3 flex items-center gap-3 text-sm">
                  <Switch checked={r.enabled} onCheckedChange={(v) => toggleRule.mutate({ id: r.id, enabled: v })} />
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
                  <Button size="icon" variant="ghost" onClick={() => deleteRule.mutate(r.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </PageContainer>
  );
}
