import type { StatusConfig } from '@/types/inventory';

export const productStatusConfig: StatusConfig[] = [
  { value: 'active', label: 'Ativo', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  { value: 'discontinued', label: 'Descontinuado', color: 'bg-red-100 text-red-800' },
];

export const productTypeConfig: StatusConfig[] = [
  { value: 'finished', label: 'Produto Acabado', color: 'bg-blue-100 text-blue-800' },
  { value: 'raw_material', label: 'Matéria Prima', color: 'bg-amber-100 text-amber-800' },
  { value: 'component', label: 'Componente', color: 'bg-purple-100 text-purple-800' },
  { value: 'packaging', label: 'Embalagem', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'consumable', label: 'Consumível', color: 'bg-gray-100 text-gray-800' },
];

export const movementTypeConfig: StatusConfig[] = [
  { value: 'purchase', label: 'Compra', color: 'bg-green-100 text-green-800' },
  { value: 'sale', label: 'Venda', color: 'bg-blue-100 text-blue-800' },
  { value: 'transfer', label: 'Transferência', color: 'bg-purple-100 text-purple-800' },
  { value: 'adjustment', label: 'Ajuste', color: 'bg-amber-100 text-amber-800' },
  { value: 'production_in', label: 'Entrada Produção', color: 'bg-teal-100 text-teal-800' },
  { value: 'production_out', label: 'Saída Produção', color: 'bg-orange-100 text-orange-800' },
  { value: 'return', label: 'Devolução', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'loss', label: 'Perda', color: 'bg-red-100 text-red-800' },
];

export const stockLevelStatusConfig: StatusConfig[] = [
  { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-800' },
  { value: 'low', label: 'Baixo', color: 'bg-amber-100 text-amber-800' },
  { value: 'critical', label: 'Crítico', color: 'bg-red-100 text-red-800' },
  { value: 'excess', label: 'Excesso', color: 'bg-blue-100 text-blue-800' },
];
