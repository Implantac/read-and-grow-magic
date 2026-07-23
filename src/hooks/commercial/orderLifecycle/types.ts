export interface OrderItemLike {
  id: string;
  product_id?: string | null;
  product_code?: string | null;
  product_name?: string | null;
  quantity: number;
}

export interface OrderLike {
  id: string;
  number: string | number;
  status: string;
  total: number;
  company_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  payment_condition?: string | null;
  delivery_date?: string | null;
  financial_approval?: string | null;
  commercial_approval?: string | null;
  items?: OrderItemLike[];
}

export interface TransitionInput {
  orderId: string;
  order: OrderLike;
  targetStatus: string;
  observation?: string;
  blockReason?: string;
  changedBy?: string;
}
