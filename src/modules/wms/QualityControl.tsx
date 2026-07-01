import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Textarea } from "@/ui/base/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { EmptyState } from "@/shared/components/EmptyState";
import { ClipboardList, Search as SearchIcon } from "lucide-react";
import { ShieldCheck, AlertTriangle, Ban, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/ui/base/use-toast";

interface Lot {
  id: string;
  lot_number: string;
  product_code: string | null;
  product_name: string | null;
  supplier: string | null;
  quantity: number | null;
  remaining_qty: number | null;
  expiration_date: string | null;
  quality_status: string | null;
  inspection_date: string | null;
  created_at: string;
}

interface Check {
  id: string;
  lot_id: string | null;
  decision: string;
  reason: string | null;
  sample_size: number | null;
  defects_found: number | null;
  created_at: string;
}

type Decision = "approved" | "quarantine" | "rejected";

const decisionMeta: Record<Decision, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  approved: { label: "Aprovado", cls: "bg-emerald-500/10 text-emerald-500", icon: ShieldCheck },
  quarantine: { label: "Quarentena", cls: "bg-amber-500/10 text-amber-500", icon: AlertTriangle },
  rejected: { label: "Rejeitado", cls: "bg-red-500/10 text-red-500", icon: Ban },
};

const KPI_DEFAULT = { total: 0, approved: 0, quarantine: 0, rejected: 0, pending: 0 };

export default function QualityControl() {
  const { toast } = useToast();
  const [lots, setLots] = useState<Lot[]>([]);
  const [recentChecks, setRecentChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | Decision>("pending");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Lot | null>(null);
  const [decision, setDecision] = useState<Decision>("approved");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [sampleSize, setSampleSize] = useState<number>(0);
  const [defects, setDefects] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [kpi, setKpi] = useState(KPI_DEFAULT);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: lotsData }, { data: checksData }] = await Promise.all([
      supabase
        .from("stock_lots")
        .select(
          "id, lot_number, product_code, product_name, supplier, quantity, remaining_qty, expiration_date, quality_status, inspection_date, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("wms_quality_checks")
        .select("id, lot_id, decision, reason, sample_size, defects_found, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    const rows = (lotsData ?? []) as Lot[];
    setLots(rows);
    setRecentChecks((checksData ?? []) as Check[]);
    setKpi({
      total: rows.length,
      approved: rows.filter((r) => r.quality_status === "approved").length,
      quarantine: rows.filter((r) => r.quality_status === "quarantine").length,
      rejected: rows.filter((r) => r.quality_status === "rejected").length,
      pending: rows.filter((r) => !r.quality_status || r.quality_status === "pending").length,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openInspect = (lot: Lot) => {
    setSelected(lot);
    setDecision("approved");
    setReason("");
    setNotes("");
    setSampleSize(0);
    setDefects(0);
    setOpen(true);
  };

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", u.user?.id ?? "")
      .maybeSingle();
    if (!profile?.company_id) {
      toast({ title: "Empresa não identificada", variant: "destructive" });
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("wms_quality_checks").insert({
      company_id: profile.company_id,
      lot_id: selected.id,
      inspector_id: u.user?.id,
      decision,
      reason: reason || null,
      notes: notes || null,
      sample_size: sampleSize,
      defects_found: defects,
    });
    if (error) {
      toast({ title: "Erro ao registrar inspeção", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inspeção registrada", description: `Lote ${selected.lot_number} → ${decisionMeta[decision].label}` });
      setOpen(false);
      await load();
    }
    setSaving(false);
  };

  const filtered = lots.filter((l) => {
    if (filter === "pending" && l.quality_status && l.quality_status !== "pending") return false;
    if (filter !== "all" && filter !== "pending" && l.quality_status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.lot_number?.toLowerCase().includes(s) ||
        l.product_code?.toLowerCase().includes(s) ||
        l.product_name?.toLowerCase().includes(s) ||
        l.supplier?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const KpiCard = ({ label, value, cls }: { label: string; value: number; cls?: string }) => (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${cls ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controle de Qualidade</h1>
          <p className="text-muted-foreground">
            Inspeção de lotes recebidos, quarentena e rastreabilidade de não-conformidades.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Atualizar
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Total de lotes" value={kpi.total} />
        <KpiCard label="Pendentes" value={kpi.pending} cls="text-blue-500" />
        <KpiCard label="Aprovados" value={kpi.approved} cls="text-emerald-500" />
        <KpiCard label="Quarentena" value={kpi.quarantine} cls="text-amber-500" />
        <KpiCard label="Rejeitados" value={kpi.rejected} cls="text-red-500" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Lotes para Inspeção</CardTitle>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Buscar lote, SKU, fornecedor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-64"
                  aria-label="Buscar lote"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-40" aria-label="Filtrar por status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="quarantine">Quarentena</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              icon={SearchIcon}
              title="Nenhum lote encontrado"
              description="Ajuste os filtros ou aguarde novos lotes chegarem via recebimento."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Qtde</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((l) => {
                  const st = (l.quality_status ?? "pending") as Decision | "pending";
                  const meta = st === "pending" ? null : decisionMeta[st];
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs">{l.lot_number}</TableCell>
                      <TableCell>
                        <div className="text-sm">{l.product_code}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{l.product_name}</div>
                      </TableCell>
                      <TableCell className="text-xs">{l.supplier ?? "—"}</TableCell>
                      <TableCell className="text-right">{l.remaining_qty ?? l.quantity ?? 0}</TableCell>
                      <TableCell className="text-xs">{l.expiration_date ?? "—"}</TableCell>
                      <TableCell>
                        {meta ? (
                          <Badge className={meta.cls}>{meta.label}</Badge>
                        ) : (
                          <Badge variant="outline">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openInspect(l)}>
                          Inspecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Inspeções</CardTitle>
        </CardHeader>
        <CardContent>
          {recentChecks.length === 0 ? (
            <EmptyState
              compact
              icon={ClipboardList}
              title="Nenhuma inspeção registrada"
              description="Inspecione lotes recebidos para começar a acumular histórico de qualidade."
            />
          ) : (
            <ul className="space-y-2">
              {recentChecks.map((c) => {
                const meta = decisionMeta[c.decision as Decision];
                const Icon = meta?.icon ?? ShieldCheck;
                return (
                  <li key={c.id} className="flex items-center gap-3 text-sm p-2 rounded border bg-card">
                    <Icon className={`h-4 w-4 ${meta?.cls.split(" ")[1] ?? ""}`} aria-hidden="true" />
                    <Badge className={meta?.cls}>{meta?.label ?? c.decision}</Badge>
                    <span className="text-muted-foreground text-xs">
                      Amostra {c.sample_size ?? 0} · Defeitos {c.defects_found ?? 0}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inspeção de Qualidade — Lote {selected?.lot_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <strong>{selected.product_code}</strong> · {selected.product_name} · Fornecedor {selected.supplier ?? "—"}
              </div>
              <div>
                <Label>Decisão</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as Decision)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprovar — liberar para armazenagem</SelectItem>
                    <SelectItem value="quarantine">Quarentena — bloquear movimentação</SelectItem>
                    <SelectItem value="rejected">Rejeitar — devolver ao fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tamanho da amostra</Label>
                  <Input type="number" min={0} value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Defeitos encontrados</Label>
                  <Input type="number" min={0} value={defects} onChange={(e) => setDefects(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>Motivo {decision !== "approved" && <span className="text-red-500">*</span>}</Label>
                <Input
                  placeholder="Ex.: avaria de transporte, validade curta, embalagem violada"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button
              onClick={submit}
              disabled={saving || (decision !== "approved" && !reason.trim())}
            >
              {saving ? "Registrando…" : "Registrar inspeção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
