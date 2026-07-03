import { type ReactNode, type ComponentType } from 'react';

export interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
  actions?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
}

export function PageHeader({ title, description, children, actions, icon: Icon }: PageHeaderProps) {
  const actionContent = actions || children;
  return (
    <div className="flex flex-col gap-4 pb-5 mb-6 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-inset ring-primary/20 shadow-elevation-1">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {actionContent && <div className="flex flex-wrap gap-2 shrink-0">{actionContent}</div>}
    </div>
  );
}
