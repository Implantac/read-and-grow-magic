import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accentColor?: string;
  className?: string;
  index?: number;
}

const colorMap: Record<string, { border: string; iconBg: string; iconText: string }> = {
  primary: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconText: 'text-primary' },
  success: { border: 'border-l-green-500', iconBg: 'bg-green-500/10', iconText: 'text-green-600' },
  warning: { border: 'border-l-yellow-500', iconBg: 'bg-yellow-500/10', iconText: 'text-yellow-600' },
  danger: { border: 'border-l-destructive', iconBg: 'bg-destructive/10', iconText: 'text-destructive' },
  info: { border: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconText: 'text-blue-600' },
  accent: { border: 'border-l-primary', iconBg: 'bg-accent/10', iconText: 'text-accent-foreground' },
};

export function KPICard({ title, value, subtitle, icon, accentColor = 'primary', className, index = 0 }: KPICardProps) {
  const colors = colorMap[accentColor] || colorMap.primary;

  return (
    <Card
      className={cn(
        'border-l-4 hover-lift opacity-0 animate-slide-in-bottom',
        colors.border,
        className
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
    >
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110', colors.iconBg)}>
          <div className={colors.iconText}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
