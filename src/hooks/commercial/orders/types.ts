export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface DbOrder {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  date: string;
  delivery_date: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  payment_condition: string;
  status: string;
  priority: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  commercial_approval: string | null;
  financial_approval: string | null;
  approved_by: string | null;
  approved_at: string | null;
  commission_rate: number | null;
  commission_value: number | null;
  internal_notes: string | null;
  expected_billing_date: string | null;
  max_discount_pct: number | null;
  estimated_cost?: number | null;
  estimated_tax?: number | null;
  estimated_margin_pct?: number | null;
  items?: DbOrderItem[];
}

export interface CreateOrderInput {
  client_id?: string | null;
  client_name: string;
  delivery_date?: string | null;
  payment_method: string;
  payment_condition: string;
  priority: string;
  shipping?: number;
  notes?: string | null;
  items: Array<{
    product_id?: string | null;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    discount: number;
  }>;
}
