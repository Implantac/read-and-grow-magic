import { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, children, actions }: PageHeaderProps) {
  const actionContent = actions || children;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionContent && <div className="flex flex-wrap gap-2">{actionContent}</div>}
    </div>
  );
}
