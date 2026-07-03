// NF-e (Nota Fiscal Eletrônica) Types
export interface NFe {
  id: string;
  number: string;
  series: string;
  accessKey: string;
  issueDate: string;
  operationType: 'entrada' | 'saida';
  clientId: string;
  clientName: string;
  clientDocument: string;
  items: NFeItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  icms: number;
  ipi: number;
  pis: number;
  cofins: number;
  total: number;
  status: NFeStatus;
  protocol?: string;
  authorizationDate?: string;
  cancellationDate?: string;
  cancellationReason?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NFeItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  icmsBase: number;
  icmsRate: number;
  icmsValue: number;
  ipiRate: number;
  ipiValue: number;
  pisRate: number;
  pisValue: number;
  cofinsRate: number;
  cofinsValue: number;
  total: number;
}

export type NFeStatus = 
  | 'draft'
  | 'pending'
  | 'authorized'
  | 'rejected'
  | 'cancelled'
  | 'denied';

// NFC-e (Nota Fiscal de Consumidor Eletrônica) Types
export interface NFCe {
  id: string;
  number: string;
  series: string;
  accessKey: string;
  issueDate: string;
  items: NFCeItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: NFCePaymentMethod;
  amountPaid: number;
  change: number;
  customerDocument?: string;
  customerName?: string;
  status: NFCeStatus;
  protocol?: string;
  authorizationDate?: string;
  cancellationDate?: string;
  cancellationReason?: string;
  returnStatus?: 'none' | 'partial' | 'full';
  qrCode?: string;
  operatorId: string;
  operatorName: string;
  terminalId: string;
  createdAt: string;
}

export interface NFCeReturn {
  id: string;
  nfceId: string;
  number: string;
  reason: string;
  refundMethod: string;
  refundAmount: number;
  status: 'draft' | 'authorized' | 'cancelled';
  operatorName?: string;
  terminalId?: string;
  createdAt: string;
  items: NFCeReturnItem[];
}

export interface NFCeReturnItem {
  id: string;
  nfceItemId?: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}


export interface NFCeItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export type NFCePaymentMethod = 
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'pix'
  | 'voucher'
  | 'multiple';

export type NFCeStatus = 
  | 'authorized'
  | 'cancelled'
  | 'contingency';

// Fiscal Reports Types
export interface FiscalReport {
  id: string;
  type: FiscalReportType;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  totalNFe: number;
  totalNFCe: number;
  totalValue: number;
  totalICMS: number;
  totalIPI: number;
  totalPIS: number;
  totalCOFINS: number;
  generatedAt: string;
  status: 'pending' | 'generated' | 'error';
  fileUrl?: string;
}

export type FiscalReportType = 
  | 'sintegra'
  | 'sped_fiscal'
  | 'sped_contribuicoes'
  | 'dapi'
  | 'gia'
  | 'monthly_summary';

// Fiscal Summary
export interface FiscalSummary {
  totalNFeIssued: number;
  totalNFCeIssued: number;
  totalNFeCancelled: number;
  totalNFCeCancelled: number;
  totalBilled: number;
  totalTaxes: number;
  avgTicketNFCe: number;
}

// Filter Types
export interface NFeFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  operationType?: string;
}

export interface NFCeFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentMethod?: string;
  terminal?: string;
}

export interface FiscalReportFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}
