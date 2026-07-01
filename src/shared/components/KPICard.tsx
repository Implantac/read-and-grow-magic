import { type ReactNode, type ElementType } from 'react';
import { Card, CardContent } from '@/ui/base/card';
import { cn } from '@/lib/utils';
import { EnterpriseKPICard } from './EnterpriseKPICard';
import type { EntityKey } from '@/core/entityRegistry';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon: ReactNode | ElementType;
  accentColor?: string;
  color?: string;
  className?: string;
  index?: number;
  /** Fase 2 — opt-in Enterprise slots. Se qualquer um for informado, o card
   *  delega ao EnterpriseKPICard (drill-down + IA) mantendo o layout base. */
  entityKey?: EntityKey;
  numericValue?: number;
  deltas?: { day?: number; week?: number; month?: number; year?: number };
  goal?: number;
  progress?: number;
  status?: 'healthy' | 'warn' | 'critical';
  impact?: { financial?: number; operational?: string };
  source?: string;
  lastUpdated?: string | Date;
  trend?: 'up' | 'down' | 'flat';
  onClick?: () => void;
}


const colorMap: Record<string, { border: string; iconBg: string; iconText: string }> = {
  primary: { border: 'border-l-primary', iconBg: 'bg-primary/10', iconText: 'text-primary' },
  success: { border: 'border-l-green-500', iconBg: 'bg-green-500/10', iconText: 'text-green-600' },
  warning: { border: 'border-l-yellow-500', iconBg: 'bg-yellow-500/10', iconText: 'text-yellow-600' },
  danger: { border: 'border-l-destructive', iconBg: 'bg-destructive/10', iconText: 'text-destructive' },
  info: { border: 'border-l-blue-500', iconBg: 'bg-blue-500/10', iconText: 'text-blue-600' },
  accent: { border: 'border-l-primary', iconBg: 'bg-accent/10', iconText: 'text-accent-foreground' },
};

export function KPICard({ title, value, subtitle, description, icon, accentColor, color, className, index = 0 }: KPICardProps) {
  const resolvedColor = accentColor || color || 'primary';
  const colors = colorMap[resolvedColor] || colorMap.primary;
  const resolvedSubtitle = subtitle || description;

  // Support both ReactNode and ElementType (component reference)
  let iconElement: ReactNode;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && 'render' in (icon as any))) {
    const IconComponent = icon as ElementType;
    iconElement = <IconComponent className="h-5 w-5" />;
  } else {
    iconElement = icon;
  }

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
          <div className={colors.iconText}>{iconElement}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
          {resolvedSubtitle && <p className="text-[11px] text-muted-foreground truncate">{resolvedSubtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
