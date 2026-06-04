import { type ReactNode } from 'react';
import { PageLoading } from './PageLoading';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

export function PageContainer({ children, loading, className }: PageContainerProps) {
  if (loading) return <PageLoading />;
  return (
    <div className={cn("space-y-6 animate-fade-in", className)}>
      {children}
    </div>
  );
}
