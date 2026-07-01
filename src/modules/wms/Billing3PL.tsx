import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/shared/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Badge } from "@/ui/base/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/base/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import { useToast } from "@/ui/base/use-toast";
import { Plus, FileText, RefreshCw, Receipt } from "lucide-react";

interface Contract {
  id: string;
  client_name: string;
  status: string;
  storage_rate_per_pallet_day: number;
  inbound_rate_per_unit: number;
  outbound_rate_per_unit: number;
  picking_rate_per_line: number;
  packing_rate_per_order: number;
  minimum_monthly_fee: number;
  currency: string;
}

interface Invoice {
  id: string;
  contract_id: string;
  period_start: string;
  period_end: string;
  storage_amount: number;
  inbound_amount: number;
  outbound_amount: number;
  picking_amount: number;
  packing_amount: number;
  minimum_adjustment: number;
  total_amount: number;
  status: string;
  generated_at: string;
}

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const today = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default function Billing3PL() {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openContract, setOpenContract] = useState(false);
  const [openInvoice, setOpenInvoice] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [period, setPeriod] = useState({ start: firstOfMonth(), end: today() });
  const [form, setForm] = useState<Partial<Contract>>({
    client_name: "",
    status: "active",
    storage_rate_per_pallet_day: 0,
    inbound_rate_per_unit: 0,
    outbound_rate_per_unit: 0,
    picking_rate_per_line: 0,
    packing_rate_per_order: 0,
    minimum_monthly_fee: 0,
    currency: "BRL",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [c, i] = await Promise.all([
      supabase.from("wms_3pl_contracts").select("*").order("created_at", { ascending: false }),
      supabase.from("wms_3pl_invoices").select("*").order("generated_at", { ascending: false }).limit(50),
    ]);
    if (c.error) toast({ title: "Erro ao carregar contratos", description: c.error.message, variant: "destructive" });
    if (i.error) toast({ title: "Erro ao carregar faturas", description: i.error.message, variant: "destructive" });
    setContracts((c.data || []) as Contract[]);
    setInvoices((i.data || []) as Invoice[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveContract = async () => {
    if (!form.client_name) {
      toast({ title: "Informe o cliente", variant: "destructive" });
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", u.user.id)
      .maybeSingle();
    if (!profile?.company_id) {
      toast({ title: "Empresa não encontrada", variant: "destructive" });
      return;
    }
    const payload = { ...form, company_id: profile.company_id };
    const { error } = await supabase.from("wms_3pl_contracts").insert(payload as never);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contrato criado" });
    setOpenContract(false);
    setForm({
      client_name: "",
      status: "active",
      storage_rate_per_pallet_day: 0,
      inbound_rate_per_unit: 0,
      outbound_rate_per_unit: 0,
      picking_rate_per_line: 0,
      packing_rate_per_order: 0,
      minimum_monthly_fee: 0,
      currency: "BRL",
    });
    void load();
  };

  const generateInvoice = async () => {
    if (!selected) return;
    const { error } = await supabase.rpc("wms_generate_3pl_invoice", {
      p_contract_id: selected.id,
      p_period_start: period.start,
      p_period_end: period.end,
    });
    if (error) {
      toast({ title: "Erro ao gerar fatura", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Fatura gerada com sucesso" });
    setOpenInvoice(false);
    void load();
  };

  const totalMTD = invoices
    .filter((i) => i.period_end >= firstOfMonth())
    .reduce((s, i) => s + Number(i.total_amount || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Faturamento 3PL</h1>
          <p className="text-sm text-muted-foreground">
            Contratos, tarifas e geração automática de faturas por movimentação e armazenagem.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} aria-label="Recarregar">
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={() => setOpenContract(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo contrato
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Contratos ativos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {contracts.filter((c) => c.status === "active").length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Faturas emitidas</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{invoices.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Faturado no mês</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-primary">{brl(totalMTD)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : contracts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum contrato cadastrado"
              description="Cadastre contratos 3PL para gerar faturas por armazenagem, entradas, saídas, picking e packing."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Armaz. (pallet/dia)</TableHead>
                  <TableHead>Entrada (un)</TableHead>
                  <TableHead>Saída (un)</TableHead>
                  <TableHead>Picking (linha)</TableHead>
                  <TableHead>Packing (pedido)</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.client_name}</TableCell>
                    <TableCell>{brl(c.storage_rate_per_pallet_day)}</TableCell>
                    <TableCell>{brl(c.inbound_rate_per_unit)}</TableCell>
                    <TableCell>{brl(c.outbound_rate_per_unit)}</TableCell>
                    <TableCell>{brl(c.picking_rate_per_line)}</TableCell>
                    <TableCell>{brl(c.packing_rate_per_order)}</TableCell>
                    <TableCell>{brl(c.minimum_monthly_fee)}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(c);
                          setOpenInvoice(true);
                        }}
                      >
                        <Receipt className="h-4 w-4 mr-1" /> Gerar fatura
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
        <CardHeader>
          <CardTitle>Faturas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <EmptyState
              compact
              title="Nenhuma fatura gerada"
              description="Gere a primeira fatura a partir de um contrato ativo."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Armazenagem</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Picking</TableHead>
                  <TableHead>Packing</TableHead>
                  <TableHead>Mínimo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((i) => {
                  const c = contracts.find((x) => x.id === i.contract_id);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs">
                        {i.period_start} → {i.period_end}
                      </TableCell>
                      <TableCell>{c?.client_name || "—"}</TableCell>
                      <TableCell>{brl(i.storage_amount)}</TableCell>
                      <TableCell>{brl(i.inbound_amount)}</TableCell>
                      <TableCell>{brl(i.outbound_amount)}</TableCell>
                      <TableCell>{brl(i.picking_amount)}</TableCell>
                      <TableCell>{brl(i.packing_amount)}</TableCell>
                      <TableCell>{brl(i.minimum_adjustment)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {brl(i.total_amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openContract} onOpenChange={setOpenContract}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo contrato 3PL</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Cliente</Label>
              <Input
                value={form.client_name || ""}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>
            {[
              ["storage_rate_per_pallet_day", "Armazenagem (R$/pallet/dia)"],
              ["inbound_rate_per_unit", "Entrada (R$/unidade)"],
              ["outbound_rate_per_unit", "Saída (R$/unidade)"],
              ["picking_rate_per_line", "Picking (R$/linha)"],
              ["packing_rate_per_order", "Packing (R$/pedido)"],
              ["minimum_monthly_fee", "Mínimo mensal (R$)"],
            ].map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={(form as Record<string, unknown>)[key] as number}
                  onChange={(e) =>
                    setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenContract(false)}>
              Cancelar
            </Button>
            <Button onClick={saveContract}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar fatura — {selected?.client_name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Início do período</Label>
              <Input
                type="date"
                value={period.start}
                onChange={(e) => setPeriod({ ...period, start: e.target.value })}
              />
            </div>
            <div>
              <Label>Fim do período</Label>
              <Input
                type="date"
                value={period.end}
                onChange={(e) => setPeriod({ ...period, end: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenInvoice(false)}>
              Cancelar
            </Button>
            <Button onClick={generateInvoice}>Gerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
