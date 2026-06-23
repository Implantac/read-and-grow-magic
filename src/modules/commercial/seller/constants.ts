import { AlertTriangle, CheckCircle, Clock, ShieldAlert, TrendingUp } from 'lucide-react';

export const RISK_CONFIG = {
  critical: { label: 'Crítico', color: 'bg-red-500', badge: 'destructive' as const, icon: ShieldAlert },
  high: { label: 'Alto', color: 'bg-orange-500', badge: 'destructive' as const, icon: AlertTriangle },
  medium: { label: 'Médio', color: 'bg-amber-500', badge: 'secondary' as const, icon: Clock },
  low: { label: 'Baixo', color: 'bg-blue-500', badge: 'secondary' as const, icon: TrendingUp },
  none: { label: 'Normal', color: 'bg-emerald-500', badge: 'default' as const, icon: CheckCircle },
};

export const OPPORTUNITY_LABELS: Record<string, string> = {
  reactivation: '🔄 Reativação',
  winback: '💰 Win-Back',
  follow_up: '📞 Follow-up',
  upsell: '📈 Upsell',
  cross_sell: '🛒 Cross-sell',
};

export const FUNNEL_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'opportunity', label: 'Oportunidade' },
  { value: 'proposal_sent', label: 'Proposta Enviada' },
  { value: 'negotiation', label: 'Negociação' },
  { value: 'awaiting_approval', label: 'Aguardando Aprovação' },
  { value: 'approved', label: 'Aprovado' },
];

export const getFunnelStageLabel = (stage: string) =>
  FUNNEL_STAGES.find(s => s.value === stage)?.label || stage;
