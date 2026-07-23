import type { BillingStatus, BillingSummary } from "./types";
import { formatCurrencyPtBr } from "./helpers";

interface Props {
  summary: BillingSummary;
  billingStatus: BillingStatus;
  setBillingStatus: React.Dispatch<React.SetStateAction<BillingStatus>>;
}

export function BillingSummaryCards({ summary, billingStatus, setBillingStatus }: Props) {
  return (
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
  );
}
