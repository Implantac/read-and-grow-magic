import { cn } from '@/lib/utils';

interface KpiTileProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  valueClassName?: string;
}

export function KpiTile({ label, value, sub, icon, valueClassName }: KpiTileProps) {
  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur p-3 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>{label}</span>
        <span className="text-primary/70">{icon}</span>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums', valueClassName)}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
