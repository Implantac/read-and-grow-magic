import type { OrderStatus, SaleStatus, PaymentMethod, QuotationStatus } from '@/types/commercial';

export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    processing: 'Em Processamento',
    separated: 'Separado',
    invoiced: 'Faturado',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };
  return labels[status];
};

export const getSaleStatusLabel = (status: SaleStatus): string => {
  const labels: Record<SaleStatus, string> = {
    completed: 'Concluída',
    cancelled: 'Cancelada',
    refunded: 'Devolvida',
  };
  return labels[status];
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Dinheiro',
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    boleto: 'Boleto',
    transfer: 'Transferência',
  };
  return labels[method];
};

export const getQuotationStatusLabel = (status: QuotationStatus): string => {
  const labels: Record<QuotationStatus, string> = {
    draft: 'Rascunho',
    sent: 'Enviado',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    expired: 'Expirado',
    converted: 'Convertido',
  };
  return labels[status];
};

export const clientSegments = [
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Varejo', label: 'Varejo' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'Distribuição', label: 'Distribuição' },
  { value: 'Construção', label: 'Construção' },
  { value: 'Pessoa Física', label: 'Pessoa Física' },
];

export const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];
