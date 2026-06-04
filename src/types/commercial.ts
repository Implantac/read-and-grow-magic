export type SaleStatus = 'completed' | 'cancelled' | 'refunded' | 'pending';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'quote' | 'awaiting_commercial_approval' | 'awaiting_financial_approval' | 'blocked' | 'awaiting_separation' | 'in_separation' | 'awaiting_production' | 'in_production' | 'partial_production' | 'awaiting_conference' | 'conferenced' | 'awaiting_billing' | 'separated' | 'invoiced';
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'transfer';

export interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface DbSale {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: SaleStatus;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  notes: string | null;
  created_at: string;
  items?: DbSaleItem[];
}

export interface CreateSaleInput {
  client_id?: string | null;
  client_name: string;
  payment_method: string;
  notes?: string | null;
  items: Array<{
    product_id?: string | null;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }>;
}
