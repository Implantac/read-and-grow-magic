import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { toastSuccess, toastError } from "@/lib/toastHelpers";

type BillingStatus = "all" | "paid" | "open" | "overdue";

type Receivable = {
  id: string;
  client_name?: string | null;
  description?: string | null;
  due_date: string;
  amount: number | string;
  open_amount?: number | string | null;
  paid_amount?: number | string | null;
  status?: string | null;
};

const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export interface BillingCardProps {
  receivables: { data?: Receivable[]; isLoading: boolean };
  markPaid: { mutateAsync: (r: Receivable) => Promise<unknown>; isPending: boolean };
  billingMonth: string;
  setBillingMonth: (v: string) => void;
  billingStatus: BillingStatus;
  setBillingStatus: React.Dispatch<React.SetStateAction<BillingStatus>>;
  billingSearch: string;
  setBillingSearch: (v: string) => void;
}

export function BillingCard({
  receivables,
  markPaid,
  billingMonth,
  setBillingMonth,
  billingStatus,
  setBillingStatus,
  billingSearch,
  setBillingSearch,
}: BillingCardProps) {
  const billingMonthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const base = new Date();
    base.setDate(1);
    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      opts.push({
        value: ym,
        label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
      });
    }
    return opts;
  }, []);

  const handleExport = () => {
    const ym = billingMonth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = billingSearch.trim().toLowerCase();
    const items = (receivables.data ?? []).filter((r) => {
      if (!r.description?.includes(`Mensalidade ${ym}`)) return false;
      if (q && !(r.client_name ?? "").toLowerCase().includes(q)) return false;
      if (billingStatus === "all") return true;
      const open = Number(r.open_amount ?? r.amount ?? 0);
      const isPaid = r.status === "paid" || open <= 0;
      const isOverdue = !isPaid && new Date(r.due_date) < today;
      if (billingStatus === "paid") return isPaid;
      if (billingStatus === "overdue") return isOverdue;
      return !isPaid && !isOverdue;
    });
    if (items.length === 0) {
      toastError("Nada para exportar.");
      return;
    }
    const header = ["Aluno", "Descrição", "Vencimento", "Valor", "Status"];
    const rows = items.map((r) => [
      r.client_name ?? "",
      r.description ?? "",
      new Date(r.due_date).toLocaleDateString("pt-BR"),
      String(Number(r.amount).toFixed(2)).replace(".", ","),
      r.status ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mensalidades-${ym}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle>Cobranças geradas</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={billingMonth} onValueChange={setBillingMonth}>
            <SelectTrigger className="w-[200px] capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {billingMonthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="capitalize">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar aluno…"
            value={billingSearch}
            onChange={(e) => setBillingSearch(e.target.value)}
            className="w-[180px]"
          />
          <Select value={billingStatus} onValueChange={(v) => setBillingStatus(v as BillingStatus)}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
              <SelectItem value="open">Em aberto</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
            </SelectContent>
          </Select>
          {(billingStatus !== "all" || billingSearch.trim() !== "") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setBillingStatus("all"); setBillingSearch(""); }}
            >
              Limpar filtros
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!receivables.data || receivables.data.length === 0}
            onClick={handleExport}
          >
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {receivables.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (() => {
          const ym = billingMonth;
          const items = (receivables.data ?? []).filter((r) =>
            r.description?.includes(`Mensalidade ${ym}`),
          );
          if (items.length === 0) {
            return (
              <p className="text-sm text-muted-foreground">
                Nenhuma mensalidade emitida neste mês.
              </p>
            );
          }
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const summary = items.reduce(
            (acc, r) => {
              const open = Number(r.open_amount ?? r.amount ?? 0);
              const paid = Number(r.paid_amount ?? 0);
              const due = new Date(r.due_date);
              const isPaid = r.status === "paid" || open <= 0;
              if (isPaid) {
                acc.paidCount++;
                acc.paidValue += paid || Number(r.amount);
              } else if (due < today) {
                acc.overdueCount++;
                acc.overdueValue += open;
              } else {
                acc.openCount++;
                acc.openValue += open;
              }
              return acc;
            },
            { paidCount: 0, paidValue: 0, openCount: 0, openValue: 0, overdueCount: 0, overdueValue: 0 },
          );
          const totalCount = summary.paidCount + summary.openCount + summary.overdueCount;
          const totalValue = summary.paidValue + summary.openValue + summary.overdueValue;
          const delinquencyRate = totalValue > 0 ? (summary.overdueValue / totalValue) * 100 : 0;
          const collectionRate = totalValue > 0 ? (summary.paidValue / totalValue) * 100 : 0;

          const in7 = new Date(today);
          in7.setDate(in7.getDate() + 7);
          const upcoming = items.filter((r) => {
            const open = Number(r.open_amount ?? r.amount ?? 0);
            const isPaid = r.status === "paid" || open <= 0;
            if (isPaid) return false;
            const due = new Date(r.due_date);
            return due >= today && due <= in7;
          });
          const totalUp = upcoming.reduce(
            (acc, r) => acc + Number(r.open_amount ?? r.amount ?? 0),
            0,
          );

          const filtered = items
            .filter((r) => {
              const q = billingSearch.trim().toLowerCase();
              if (q && !(r.client_name ?? "").toLowerCase().includes(q)) return false;
              if (billingStatus === "all") return true;
              const open = Number(r.open_amount ?? r.amount ?? 0);
              const isPaid = r.status === "paid" || open <= 0;
              const isOverdue = !isPaid && new Date(r.due_date) < today;
              if (billingStatus === "paid") return isPaid;
              if (billingStatus === "overdue") return isOverdue;
              return !isPaid && !isOverdue;
            })
            .sort((a, b) => {
              const rank = (r: Receivable) => {
                const open = Number(r.open_amount ?? r.amount ?? 0);
                const isPaid = r.status === "paid" || open <= 0;
                if (isPaid) return 2;
                return new Date(r.due_date) < today ? 0 : 1;
              };
              const ra = rank(a);
              const rb = rank(b);
              if (ra !== rb) return ra - rb;
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
          const visible = filtered.slice(0, 20);
          const hidden = filtered.length - visible.length;
          const filteredTotalValue = filtered.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
          const filteredTotalOpen = filtered.reduce(
            (acc, r) => acc + Number(r.open_amount ?? r.amount ?? 0),
            0,
          );

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingStatus((s) => (s === "paid" ? "all" : "paid"))}
                  className={`text-left rounded-lg border p-3 transition hover:bg-muted/40 ${
                    billingStatus === "paid" ? "ring-2 ring-primary" : ""
                  }`}
                  aria-pressed={billingStatus === "paid"}
                >
                  <div className="text-xs text-muted-foreground">Pagas</div>
                  <div className="text-lg font-semibold">{summary.paidCount}</div>
                  <div className="text-xs">{formatCurrencyPtBr(summary.paidValue)}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingStatus((s) => (s === "open" ? "all" : "open"))}
                  className={`text-left rounded-lg border p-3 transition hover:bg-muted/40 ${
                    billingStatus === "open" ? "ring-2 ring-primary" : ""
                  }`}
                  aria-pressed={billingStatus === "open"}
                >
                  <div className="text-xs text-muted-foreground">Em aberto</div>
                  <div className="text-lg font-semibold">{summary.openCount}</div>
                  <div className="text-xs">{formatCurrencyPtBr(summary.openValue)}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingStatus((s) => (s === "overdue" ? "all" : "overdue"))}
                  className={`text-left rounded-lg border border-destructive/40 p-3 transition hover:bg-destructive/10 ${
                    billingStatus === "overdue" ? "ring-2 ring-destructive" : ""
                  }`}
                  aria-pressed={billingStatus === "overdue"}
                >
                  <div className="text-xs text-destructive">Vencidas</div>
                  <div className="text-lg font-semibold text-destructive">{summary.overdueCount}</div>
                  <div className="text-xs text-destructive">{formatCurrencyPtBr(summary.overdueValue)}</div>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Total emitido: <strong className="text-foreground">{totalCount}</strong> ·{" "}
                  <strong className="text-foreground">{formatCurrencyPtBr(totalValue)}</strong>
                </span>
                <span>
                  Taxa de recebimento:{" "}
                  <strong className="text-foreground">{collectionRate.toFixed(1)}%</strong>
                </span>
                <span>
                  Inadimplência:{" "}
                  <strong className={delinquencyRate > 0 ? "text-destructive" : "text-foreground"}>
                    {delinquencyRate.toFixed(1)}%
                  </strong>
                </span>
              </div>
              {upcoming.length > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs flex items-center justify-between gap-3">
                  <span>
                    <strong>{upcoming.length}</strong> cobrança(s) vencem nos próximos 7 dias —{" "}
                    <strong>{formatCurrencyPtBr(totalUp)}</strong> a receber.
                  </span>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setBillingStatus("open")}>
                    Ver em aberto
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => {
                    const due = new Date(r.due_date);
                    const open = Number(r.open_amount ?? r.amount ?? 0);
                    const isPaid = r.status === "paid" || open <= 0;
                    const isOverdue = !isPaid && due < today;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.client_name}</TableCell>
                        <TableCell className="text-xs">{due.toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-right">{formatCurrencyPtBr(Number(r.amount))}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"}>
                            {isPaid ? "Paga" : isOverdue ? "Vencida" : "Em aberto"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isPaid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Copiar mensagem de cobrança"
                                onClick={async () => {
                                  const msg = `Olá ${r.client_name ?? ""}, sua mensalidade${
                                    r.description ? ` (${r.description})` : ""
                                  } no valor de ${formatCurrencyPtBr(
                                    open || Number(r.amount),
                                  )} ${isOverdue ? "venceu em" : "vence em"} ${due.toLocaleDateString("pt-BR")}. Qualquer dúvida, estamos à disposição.`;
                                  try {
                                    await navigator.clipboard.writeText(msg);
                                    toastSuccess("Mensagem copiada.");
                                  } catch {
                                    toastError("Não foi possível copiar.");
                                  }
                                }}
                              >
                                Copiar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPaid || markPaid.isPending}
                              onClick={async () => {
                                try {
                                  await markPaid.mutateAsync(r);
                                  toastSuccess("Mensalidade marcada como paga.");
                                } catch (e: unknown) {
                                  const msg = e instanceof Error ? e.message : "Falha ao marcar como paga.";
                                  toastError(msg);
                                }
                              }}
                            >
                              {isPaid ? "Paga" : "Marcar paga"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">
                        Nenhuma cobrança corresponde aos filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.length > 0 && (
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>
                        Totais ({filtered.length}
                        {hidden > 0 ? ` • ${hidden} ocultas` : ""})
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Em aberto: {formatCurrencyPtBr(filteredTotalOpen)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrencyPtBr(filteredTotalValue)}</TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
