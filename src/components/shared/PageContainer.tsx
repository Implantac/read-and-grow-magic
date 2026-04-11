import { type ReactNode } from 'react';
import { PageLoading } from './PageLoading';

export interface PageContainerProps {
  children: ReactNode;
  loading?: boolean;
}

export function PageContainer({ children, loading }: PageContainerProps) {
  if (loading) return <PageLoading />;
  return (
    <div className="space-y-6 animate-fade-in">
      {children}
    </div>
  );
}
