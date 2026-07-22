import { ReactNode } from 'react';
import { useAccess, type UseAccessInput } from '@/hooks/useAccess';
import { Skeleton } from '@/components/ui/skeleton';

interface AccessGuardProps extends UseAccessInput {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * AUD-3: guard unificado que combina plano + módulo + permissão + role via useAccess.
 * Substitui uso combinado de <RoleGuard> + <Can> + checagem de plano manual.
 */
export function AccessGuard({
  children,
  fallback = null,
  loadingFallback = <Skeleton className="h-16 w-full" />,
  ...criteria
}: AccessGuardProps) {
  const { allowed, loading } = useAccess(criteria);
  if (loading) return <>{loadingFallback}</>;
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
