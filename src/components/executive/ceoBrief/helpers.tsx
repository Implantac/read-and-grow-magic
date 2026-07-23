import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const impactColor = (impacto: string) => {
  if (impacto === 'alto') return 'destructive';
  if (impacto === 'medio') return 'secondary';
  return 'outline';
};

export const trendIcon = (t?: string | null) => {
  const v = t ?? 'neutral';
  if (v === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
  if (v === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export const priorityColor = (p: string) =>
  p === 'alta' ? 'destructive' : p === 'media' ? 'secondary' : 'outline';

export const statusBadgeVariant = (s: string) =>
  s === 'critico' ? 'destructive' : s === 'alerta' ? 'secondary' : 'outline';

export const statusBorder = (s: string) =>
  s === 'critico' ? 'border-l-destructive' : s === 'alerta' ? 'border-l-warning' : 'border-l-success';

export function normalizeKPI(k: any) {
  return {
    kpi_name: k?.kpi_name ?? k?.name ?? 'kpi',
    category: k?.category ?? 'general',
    current_value: Number(k?.current_value ?? k?.value ?? 0),
    target_value: Number(k?.target_value ?? 0),
    status: k?.status ?? 'ok',
    trend: k?.trend ?? 'neutral',
    explanation: k?.explanation ?? '',
    snapshot_date: k?.snapshot_date ?? '',
  };
}
