export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'transfer' | 'cash' | 'check';

export interface AccountPayable {
  id: string;
  description: string;
  supplier: string;
  category: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface AccountReceivable {
  id: string;
  description: string;
  client: string;
  clientId: string;
  category: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  invoiceNumber?: string;
  orderId?: string;
  createdAt: string;
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

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  boleto: 'Boleto',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  transfer: 'Transferência',
  cash: 'Dinheiro',
  check: 'Cheque',
};

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
