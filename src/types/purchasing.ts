// Supplier Types
export interface Supplier {
  id: string;
  code: string;
  name: string;
  tradeName?: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  email: string;
  phone: string;
  cellphone?: string;
  address: SupplierAddress;
  status: 'active' | 'inactive' | 'blocked';
  category: string;
  paymentTerms: string;
  deliveryTime: number; // days
  rating: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface SupplierAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

// Purchase Order Types
export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDelivery: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  taxes: number;
  total: number;
  paymentTerms: string;
  paymentCondition: string;
  status: PurchaseOrderStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  buyerId: string;
  buyerName: string;
  notes?: string;
  quotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  unit: string;
}

export type PurchaseOrderStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'confirmed'
  | 'partial_received'
  | 'received'
  | 'cancelled';

// Quotation Types
export interface Quotation {
  id: string;
  number: string;
  title: string;
  description?: string;
  date: string;
  deadline: string;
  items: QuotationItem[];
  suppliers: QuotationSupplier[];
  status: QuotationStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  buyerId: string;
  buyerName: string;
  selectedSupplierId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export interface QuotationSupplier {
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'responded' | 'declined';
  responseDate?: string;
  items?: QuotationSupplierItem[];
  totalValue?: number;
  deliveryTime?: number;
  paymentTerms?: string;
  validUntil?: string;
  notes?: string;
}

export interface QuotationSupplierItem {
  itemId: string;
  unitPrice: number;
  total: number;
  available: boolean;
  deliveryTime?: number;
}

export type QuotationStatus = 
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Filter Types
export interface SupplierFilters {
  search?: string;
  status?: string;
  category?: string;
  state?: string;
}

export interface PurchaseOrderFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
  supplierId?: string;
}

export interface QuotationFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
}
