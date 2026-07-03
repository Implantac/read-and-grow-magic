import { ReactNode } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { EmptyState } from '@/shared/components/EmptyState';

interface RequirePermissionProps {
  resource: string;
  action: string;
  children: ReactNode;
}

/**
 * Route-level permission guard. Blocks rendering with a friendly empty state
 * when the current user lacks the required permission on the active tenant.
 */
export function RequirePermission({ resource, action, children }: RequirePermissionProps) {
  const { allowed, loading } = usePermission(resource, action);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6">
        <EmptyState
          icon={ShieldAlert}
          title="Acesso restrito"
          description="Você não possui permissão para acessar este módulo. Solicite ao administrador o perfil adequado."
        />
      </div>
    );
  }

  return <>{children}</>;
}
