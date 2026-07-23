export type BillingStatus = "all" | "paid" | "open" | "overdue";

export type Receivable = {
  id: string;
  client_name?: string | null;
  description?: string | null;
  due_date: string;
  amount: number | string;
  open_amount?: number | string | null;
  paid_amount?: number | string | null;
  status?: string | null;
};

export type BillingSummary = {
  paidCount: number;
  paidValue: number;
  openCount: number;
  openValue: number;
  overdueCount: number;
  overdueValue: number;
};
