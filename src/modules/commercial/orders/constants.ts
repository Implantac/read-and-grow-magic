import type { FilterField } from '@/shared/components/AdvancedFilters';

export const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'pending', label: 'Pendente' }, { value: 'confirmed', label: 'Confirmado' },
    { value: 'processing', label: 'Processando' }, { value: 'separated', label: 'Separado' },
    { value: 'invoiced', label: 'Faturado' }, { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' }, { value: 'cancelled', label: 'Cancelado' },
  ]},
  { key: 'priority', label: 'Prioridade', type: 'select', options: [
    { value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' }, { value: 'urgent', label: 'Urgente' },
  ]},
  { key: 'paymentMethod', label: 'Forma de Pagamento', type: 'select', options: [
    { value: 'cash', label: 'Dinheiro' }, { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' }, { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' }, { value: 'transfer', label: 'Transferência' },
  ]},
  { key: 'startDate', label: 'Data Inicial', type: 'date' },
  { key: 'endDate', label: 'Data Final', type: 'date' },
];

export const statusSteps = ['pending', 'confirmed', 'processing', 'separated', 'invoiced', 'shipped', 'delivered'];

export const statusFlow: Record<string, string | null> = {
  pending: 'confirmed', confirmed: 'processing', processing: 'separated',
  separated: 'invoiced', invoiced: 'shipped', shipped: 'delivered',
  delivered: null, cancelled: null,
};
