// Client Types
export interface Client {
  id: string;
  code: string;
  name: string;
  tradeName?: string;
  document: string; // CPF or CNPJ
  documentType: 'cpf' | 'cnpj';
  email: string;
  phone: string;
  cellphone?: string;
  address: Address;
  status: 'active' | 'inactive' | 'blocked';
  creditLimit: number;
  currentBalance: number;
  segment?: string;
  salesRepId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// Sale Types
export interface Sale {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  salesRepId: string;
  salesRepName: string;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'transfer';
export type SaleStatus = 'completed' | 'cancelled' | 'refunded';

// Order Types
export interface Order {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  date: string;
  deliveryDate?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentCondition: string;
  status: OrderStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  salesRepId: string;
  salesRepName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'separated'
  | 'invoiced'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

// Filter Types
export interface ClientFilters {
  search?: string;
  status?: string;
  segment?: string;
  state?: string;
}

export interface SaleFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  minValue?: number;
  maxValue?: number;
}

export interface OrderFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  paymentMethod?: string;
}
