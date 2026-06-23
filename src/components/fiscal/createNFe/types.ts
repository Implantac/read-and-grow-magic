import { FileText, Users, Package, Calculator, Truck, CreditCard, ClipboardCheck } from 'lucide-react';

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

export const STEPS = [
  { id: 'info', label: 'Dados', icon: FileText },
  { id: 'client', label: 'Cliente', icon: Users },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'taxes', label: 'Tributos', icon: Calculator },
  { id: 'transport', label: 'Logística', icon: Truck },
  { id: 'finance', label: 'Pagamento', icon: CreditCard },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];
