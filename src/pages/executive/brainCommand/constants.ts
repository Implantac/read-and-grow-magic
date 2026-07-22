export const impactColor: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-muted text-muted-foreground',
};

export const AGENTS = [
  { id: 'general', label: '🧠 Geral' },
  { id: 'financial', label: '💰 CFO' },
  { id: 'commercial', label: '📈 Vendas' },
  { id: 'fiscal', label: '🧾 Fiscal' },
  { id: 'operational', label: '🚚 Operações' },
  { id: 'production', label: '🏭 PCP' },
  { id: 'quality', label: '🔬 Qualidade' },
];
