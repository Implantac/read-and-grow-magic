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
import { Skeleton } from "@/ui/base/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { toastError } from "@/lib/toastHelpers";
import type { BillingStatus, Receivable } from "./billing/types";
import {
  buildBillingMonthOptions,
  computeSummary,
  exportReceivablesCsv,
  filterReceivables,
  formatCurrencyPtBr,
  isPaidReceivable,
  sortReceivables,
} from "./billing/helpers";
import { BillingSummaryCards } from "./billing/BillingSummaryCards";
import { BillingRow } from "./billing/BillingRow";

export type { BillingStatus, Receivable } from "./billing/types";

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
  const billingMonthOptions = useMemo(() => buildBillingMonthOptions(), []);

  const handleExport = () => {
    const ym = billingMonth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthItems = (receivables.data ?? []).filter((r) =>
      r.description?.includes(`Mensalidade ${ym}`),
    );
    const items = filterReceivables(monthItems, billingSearch, billingStatus, today);
    if (items.length === 0) {
      toastError("Nada para exportar.");
      return;
    }
    exportReceivablesCsv(items, ym);
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
          const summary = computeSummary(items, today);
          const totalCount = summary.paidCount + summary.openCount + summary.overdueCount;
          const totalValue = summary.paidValue + summary.openValue + summary.overdueValue;
          const delinquencyRate = totalValue > 0 ? (summary.overdueValue / totalValue) * 100 : 0;
          const collectionRate = totalValue > 0 ? (summary.paidValue / totalValue) * 100 : 0;

          const in7 = new Date(today);
          in7.setDate(in7.getDate() + 7);
          const upcoming = items.filter((r) => {
            if (isPaidReceivable(r)) return false;
            const due = new Date(r.due_date);
            return due >= today && due <= in7;
          });
          const totalUp = upcoming.reduce(
            (acc, r) => acc + Number(r.open_amount ?? r.amount ?? 0),
            0,
          );

          const filtered = sortReceivables(
            filterReceivables(items, billingSearch, billingStatus, today),
            today,
          );
          const visible = filtered.slice(0, 20);
          const hidden = filtered.length - visible.length;
          const filteredTotalValue = filtered.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
          const filteredTotalOpen = filtered.reduce(
            (acc, r) => acc + Number(r.open_amount ?? r.amount ?? 0),
            0,
          );

          return (
            <div className="space-y-4">
              <BillingSummaryCards
                summary={summary}
                billingStatus={billingStatus}
                setBillingStatus={setBillingStatus}
              />
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
                  {visible.map((r) => (
                    <BillingRow key={r.id} receivable={r} today={today} markPaid={markPaid} />
                  ))}
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
