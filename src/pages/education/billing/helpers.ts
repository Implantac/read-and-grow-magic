import type { BillingStatus, BillingSummary, Receivable } from "./types";

export const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export function buildBillingMonthOptions() {
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
}

export function isPaidReceivable(r: Receivable) {
  const open = Number(r.open_amount ?? r.amount ?? 0);
  return r.status === "paid" || open <= 0;
}

export function computeSummary(items: Receivable[], today: Date): BillingSummary {
  return items.reduce<BillingSummary>(
    (acc, r) => {
      const open = Number(r.open_amount ?? r.amount ?? 0);
      const paid = Number(r.paid_amount ?? 0);
      const due = new Date(r.due_date);
      const isPaid = isPaidReceivable(r);
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
}

export function filterReceivables(
  items: Receivable[],
  billingSearch: string,
  billingStatus: BillingStatus,
  today: Date,
) {
  const q = billingSearch.trim().toLowerCase();
  return items.filter((r) => {
    if (q && !(r.client_name ?? "").toLowerCase().includes(q)) return false;
    if (billingStatus === "all") return true;
    const isPaid = isPaidReceivable(r);
    const isOverdue = !isPaid && new Date(r.due_date) < today;
    if (billingStatus === "paid") return isPaid;
    if (billingStatus === "overdue") return isOverdue;
    return !isPaid && !isOverdue;
  });
}

export function sortReceivables(items: Receivable[], today: Date) {
  return [...items].sort((a, b) => {
    const rank = (r: Receivable) => {
      if (isPaidReceivable(r)) return 2;
      return new Date(r.due_date) < today ? 0 : 1;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

export function exportReceivablesCsv(items: Receivable[], ym: string) {
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
}
