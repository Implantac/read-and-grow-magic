// Centralized PT-BR labels for plan module keys returned by edge functions
// (used in plan-required / module-locked responses).
export const MODULE_LABELS: Record<string, string> = {
  comercial: 'Comercial',
  estoque: 'Estoque',
  financeiro: 'Financeiro',
  producao: 'Produção (PCP)',
  fiscal: 'Fiscal (NF-e/SPED)',
  compras: 'Compras',
  wms: 'WMS',
  contabilidade: 'Contabilidade',
  rfid: 'RFID',
  credito: 'Crédito & Cobrança',
  relatorios: 'Relatórios Avançados',
  admin: 'Administração',
  executivo: 'IA Executiva',
};

export function moduleLabel(key?: string | null): string {
  if (!key) return 'este módulo';
  return MODULE_LABELS[key] ?? key;
}
