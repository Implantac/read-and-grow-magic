import { FinancialCategory } from '@/types/financial';

export const financialCategories: FinancialCategory[] = [
  { id: '1', name: 'Vendas', type: 'income', color: '#22c55e' },
  { id: '2', name: 'Serviços', type: 'income', color: '#3b82f6' },
  { id: '3', name: 'Fornecedores', type: 'expense', color: '#ef4444' },
  { id: '4', name: 'Folha de Pagamento', type: 'expense', color: '#f97316' },
  { id: '5', name: 'Impostos', type: 'expense', color: '#8b5cf6' },
  { id: '6', name: 'Aluguel', type: 'expense', color: '#ec4899' },
  { id: '7', name: 'Utilidades', type: 'expense', color: '#06b6d4' },
  { id: '8', name: 'Marketing', type: 'expense', color: '#eab308' },
];
