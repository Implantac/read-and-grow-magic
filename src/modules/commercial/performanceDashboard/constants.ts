export const MEDAL_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];
export const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const FUNNEL_STAGES = ['lead', 'opportunity', 'proposal_sent', 'negotiation', 'awaiting_approval', 'approved'];
export const FUNNEL_LABELS: Record<string, string> = {
  lead: 'Lead',
  opportunity: 'Oportunidade',
  proposal_sent: 'Proposta',
  negotiation: 'Negociação',
  awaiting_approval: 'Aprovação',
  approved: 'Aprovado',
};

export const LOST_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  stagnant_funnel: { icon: '⏳', color: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20' },
  no_followup: { icon: '📞', color: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20' },
  expired_quote: { icon: '📄', color: 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/20' },
  cancelled_order: { icon: '❌', color: 'border-red-500/50 bg-red-50 dark:bg-red-950/20' },
};

export const fmtShort = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
