export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'transfer' | 'cash';

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
