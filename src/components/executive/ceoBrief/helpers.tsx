import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { CEOKPI } from './types';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const impactColor = (impacto: string): BadgeVariant => {
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

export const priorityColor = (p: string): BadgeVariant =>
  p === 'alta' ? 'destructive' : p === 'media' ? 'secondary' : 'outline';

export const statusBadgeVariant = (s: string): BadgeVariant =>
  s === 'critico' ? 'destructive' : s === 'alerta' ? 'secondary' : 'outline';

export const statusBorder = (s: string) =>
  s === 'critico' ? 'border-l-destructive' : s === 'alerta' ? 'border-l-warning' : 'border-l-success';

export function normalizeKPI(input: unknown): CEOKPI {
  const k = (input ?? {}) as Record<string, unknown>;
  return {
    kpi_name: (k.kpi_name as string) ?? (k.name as string) ?? 'kpi',
    category: (k.category as string) ?? 'general',
    current_value: Number(k.current_value ?? k.value ?? 0),
    target_value: Number(k.target_value ?? 0),
    status: (k.status as string) ?? 'ok',
    trend: (k.trend as string) ?? 'neutral',
    explanation: (k.explanation as string) ?? '',
    snapshot_date: (k.snapshot_date as string) ?? '',
  };
}
