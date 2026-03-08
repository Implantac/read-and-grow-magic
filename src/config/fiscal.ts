export const cfopOptions = [
  { value: '5101', label: '5101 - Venda de produção do estabelecimento' },
  { value: '5102', label: '5102 - Venda de mercadoria adquirida' },
  { value: '5103', label: '5103 - Venda de produção efetuada fora' },
  { value: '5401', label: '5401 - Venda de produção (ST)' },
  { value: '5403', label: '5403 - Venda de mercadoria (ST)' },
  { value: '5405', label: '5405 - Venda de mercadoria adquirida (ST)' },
  { value: '6101', label: '6101 - Venda produção p/ outro estado' },
  { value: '6102', label: '6102 - Venda mercadoria p/ outro estado' },
];

export const nfcePaymentMethodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  voucher: 'Vale',
  multiple: 'Múltiplo',
};

export const nfeStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  pending: 'Pendente',
  authorized: 'Autorizada',
  rejected: 'Rejeitada',
  cancelled: 'Cancelada',
  denied: 'Denegada',
};

export const reportTypeLabels: Record<string, string> = {
  sintegra: 'SINTEGRA',
  sped_fiscal: 'SPED Fiscal',
  sped_contribuicoes: 'SPED Contribuições',
  dapi: 'DAPI',
  gia: 'GIA',
  monthly_summary: 'Resumo Mensal',
};
