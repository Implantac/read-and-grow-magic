export const periodOptions = [
  { value: 'jan-24', label: 'Janeiro/2024' },
  { value: 'dez-23', label: 'Dezembro/2023' },
  { value: 'nov-23', label: 'Novembro/2023' },
  { value: 'out-23', label: 'Outubro/2023' },
  { value: 'set-23', label: 'Setembro/2023' },
  { value: 'ago-23', label: 'Agosto/2023' },
  { value: 'q4-23', label: '4º Trimestre/2023' },
  { value: 'q3-23', label: '3º Trimestre/2023' },
];

export const getAccountTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    asset: 'Ativo',
    liability: 'Passivo',
    equity: 'Patrimônio Líquido',
    revenue: 'Receita',
    expense: 'Despesa',
  };
  return labels[type] || type;
};

export const getJournalStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    posted: 'Lançado',
    reversed: 'Estornado',
  };
  return labels[status] || status;
};
