export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'transfer' | 'cash' | 'check';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  transfer: 'Transferência',
  cash: 'Dinheiro',
  check: 'Cheque',
};

export interface AccountPayable {
  id: string;
  description: string;
  supplier: string;
  category: string;
  amount: number;
  original_amount: number | null;
  open_amount: number | null;
  paid_amount: number | null;
  interest: number | null;
  penalty: number | null;
  discount_amount: number | null;
  due_date: string;
  payment_date: string | null;
  status: PaymentStatus | string;
  payment_method: PaymentMethod | string | null;
  notes: string | null;
  invoice_number: string | null;
  expense_type: string | null;
  cost_center_id: string | null;
  bank_account_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  created_at: string;
  updated_at: string;
}

export interface AccountReceivable {
  id: string;
  description: string;
  client_name: string;
  client_id: string | null;
  category: string;
  amount: number;
  original_amount: number | null;
  open_amount: number | null;
  paid_amount: number | null;
  interest: number | null;
  penalty: number | null;
  discount_amount: number | null;
  due_date: string;
  issue_date: string | null;
  payment_date: string | null;
  status: PaymentStatus | string;
  payment_method: PaymentMethod | string | null;
  notes: string | null;
  invoice_number: string | null;
  nfe_id: string | null;
  order_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  category: string;
  amount: number;
  balance: number;
  reference?: string;
  account: string;
}

export interface FinancialSummary {
  totalReceivable: number;
  totalPayable: number;
  overdueReceivable: number;
  overduePayable: number;
  receivedToday: number;
  paidToday: number;
  projectedBalance: number;
  currentBalance: number;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export type CheckStatus = 'received' | 'deposited' | 'cleared' | 'bounced' | 'cancelled' | 'issued';
export type BoletoStatus = 'pending' | 'registered' | 'paid' | 'cancelled' | 'expired';

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  received: 'Recebido',
  deposited: 'Depositado',
  cleared: 'Compensado',
  bounced: 'Devolvido',
  cancelled: 'Cancelado',
  issued: 'Emitido',
};

export const BOLETO_STATUS_LABELS: Record<BoletoStatus, string> = {
  pending: 'Pendente',
  registered: 'Registrado',
  paid: 'Pago',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};
