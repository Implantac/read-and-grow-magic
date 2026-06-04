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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actionContent && <div className="flex flex-wrap gap-2">{actionContent}</div>}
    </div>
  );
}
