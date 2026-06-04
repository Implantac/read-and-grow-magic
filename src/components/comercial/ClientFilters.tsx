import { AdvancedFilters, type FilterField } from '@/shared/components/AdvancedFilters';
import { clientSegments, brazilianStates } from '@/config/commercial';

interface Props {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClear: () => void;
}

const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }, { value: 'blocked', label: 'Bloqueado' },
  ]},
  { key: 'segment', label: 'Segmento', type: 'select', options: clientSegments },
  { key: 'state', label: 'Estado', type: 'select', options: brazilianStates },
  { key: 'abc_classification', label: 'Curva ABC', type: 'select', options: [
    { value: 'A', label: 'A - Alta' }, { value: 'B', label: 'B - Média' }, { value: 'C', label: 'C - Baixa' },
  ]},
];

export function ClientFilters({ values, onChange, onClear }: Props) {
  return (
    <AdvancedFilters 
      fields={filterFields} 
      values={values} 
      onChange={onChange} 
      onClear={onClear} 
    />
  );
}
