/**
 * Tipos canônicos compartilhados do módulo Fiscal.
 * Centraliza definições reutilizadas por componentes, hooks e módulos fiscais
 * (NFe, NFCe, CTe, MDFe, dashboard, importação XML).
 *
 * Regra: novos tipos de domínio fiscal devem ser declarados aqui.
 * Tipos de Props locais permanecem no componente que os consome.
 */

// ============================================================
// Status fiscal (DFe lifecycle)
// ============================================================
export type FiscalStatus =
  | 'draft'
  | 'pending'
  | 'authorized'
  | 'rejected'
  | 'cancelled'
  | 'denied'
  | 'closed'
  | 'contingency';

// ============================================================
// Wizards / Steppers fiscais
// ============================================================
export interface FiscalStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================================
// SmartSelect (combobox de domínio fiscal)
// ============================================================
export interface SmartSelectOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
}

// ============================================================
// NFe / NFCe — formulário de emissão
// ============================================================
export interface NFeItemForm {
  productCode: string;
  productName: string;
  productId?: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  icms?: number;
  pis?: number;
  cofins?: number;
  ipi?: number;
  ibs?: number;
  cbs?: number;
}

// ============================================================
// Importação de XML (NFe de entrada)
// ============================================================
export interface XMLTaxes {
  icms: number;
  ipi: number;
  pis: number;
  cofins: number;
}

export interface XMLSupplier {
  name: string;
  cnpj: string;
  ie: string;
}

export interface XMLProduct {
  code: string;
  description: string;
  ncm: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  taxes: XMLTaxes;
  linkedProductId?: string;
  linkedProductName?: string;
}

export interface XMLData {
  accessKey: string;
  number: string;
  series: string;
  issueDate: string;
  supplier: XMLSupplier;
  products: XMLProduct[];
  total: number;
  purchaseOrderId?: string;
}

export interface SystemProduct {
  id: string;
  name: string;
  code: string;
}
