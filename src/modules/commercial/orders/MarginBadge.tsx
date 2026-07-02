import { Badge } from '@/ui/base/badge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface Props {
  value: number | null | undefined;
  size?: 'sm' | 'md';
}

/**
 * Semáforo de margem líquida estimada:
 *  ≥ 20%  verde   (saudável)
 *  8-20%  amarelo (aceitável)
 *  < 8%   vermelho (crítico)
 */
export function MarginBadge({ value, size = 'sm' }: Props) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const pct = Number(value);
  const tone =
    pct >= 20 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' :
    pct >= 8  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500' :
                'border-destructive/40 bg-destructive/10 text-destructive';
  const Icon = pct >= 20 ? TrendingUp : pct >= 8 ? Minus : TrendingDown;
  return (
    <Badge variant="outline" className={`gap-1 font-mono ${tone} ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
      <Icon className="h-3 w-3" />
      {pct.toFixed(1)}%
    </Badge>
  );
}
