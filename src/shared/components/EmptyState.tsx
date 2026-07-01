import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

/**
 * Standardized empty state for lists, tables, and modules.
 * Use whenever a query returns zero rows or a filter yields no matches.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const renderAction = (a: EmptyStateAction) => {
    const AIcon = a.icon;
    const content = (
      <>
        {AIcon && <AIcon className="h-4 w-4" aria-hidden="true" />}
        {a.label}
      </>
    );
    if (a.href) {
      return (
        <Button asChild variant={a.variant ?? 'default'} size="sm" className="gap-2">
          <a href={a.href}>{content}</a>
        </Button>
      );
    }
    return (
      <Button variant={a.variant ?? 'default'} size="sm" onClick={a.onClick} className="gap-2">
        {content}
      </Button>
    );
  };

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-border/60 bg-card/30 backdrop-blur-sm',
        compact ? 'py-8 px-4 gap-2' : 'py-14 px-6 gap-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20',
          compact ? 'h-10 w-10' : 'h-14 w-14',
        )}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-7 w-7'} aria-hidden="true" />
      </div>
      <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>
      {description && (
        <p className={cn('max-w-md text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action && renderAction(action)}
          {secondaryAction && renderAction({ variant: 'outline', ...secondaryAction })}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
