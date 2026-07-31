// Shapes of the rows selected in `useSuccessData` — kept narrow on purpose:
// each interface mirrors exactly the columns requested in the query.

export interface SaleRow {
  id: string;
  client_id: string | null;
  client_name: string | null;
  total: number | null;
  date: string;
}

export interface ReceivableRow {
  client_name: string | null;
  amount: number | null;
  due_date: string;
  status: string | null;
  invoice_number: string | null;
  payment_date: string | null;
  category: string | null;
}

export interface PayableRow {
  amount: number | null;
  due_date: string;
  status: string | null;
  payment_date: string | null;
}

export interface ProductRow {
  id: string;
  code: string | null;
  name: string | null;
  sale_price: number | null;
  cost_price: number | null;
  unit: string | null;
  subcategory: string | null;
}

export interface StockBalanceRow {
  product_id: string | null;
  product_code: string;
  product_name: string;
  quantity: number | null;
  unit: string | null;
}

export interface SaleItem90Row {
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  total: number | null;
  sale_id: string | null;
  sales: { date: string; client_id: string | null; client_name: string | null } | null;
}

export interface SaleItem12mRow {
  product_code: string | null;
  sales: { date: string } | null;
}

export interface PurchaseOrderRow {
  supplier_name: string | null;
  total: number | null;
  date: string;
  status: string | null;
}
