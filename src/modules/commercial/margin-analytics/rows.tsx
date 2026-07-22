import { MarginBadge } from '../orders/MarginBadge';
import { fmtBRL } from './utils';

export function Row({ label, count, total, tone }: { label: string; count: number; total: number; tone: 'emerald' | 'yellow' | 'red' }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const bar = tone === 'emerald' ? 'bg-emerald-500' : tone === 'yellow' ? 'bg-yellow-500' : 'bg-destructive';
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono text-muted-foreground">{count} · {pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function OrderRow({ number, client, total, margin }: { number: string; client: string; total: number; margin: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
      <div className="min-w-0">
        <div className="font-medium truncate">#{number}</div>
        <div className="text-xs text-muted-foreground truncate">{client}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-muted-foreground">{fmtBRL(total)}</span>
        <MarginBadge value={margin} />
      </div>
    </div>
  );
}

export function DimensionRow({ label, revenue, margin, count }: { label: string; revenue: number; margin: number; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
      <div className="min-w-0">
        <div className="font-medium truncate">{label}</div>
        <div className="text-xs text-muted-foreground">{count} pedido{count !== 1 ? 's' : ''}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-xs text-muted-foreground">{fmtBRL(revenue)}</span>
        <MarginBadge value={margin} />
      </div>
    </div>
  );
}
