import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useHasModule } from '@/hooks/system/useCurrentPlan';

interface FeatureGateProps {
  /** Chave do módulo conforme `plans.allowed_modules` (ex: 'wms', 'fiscal', 'producao'). */
  module: string;
  children: ReactNode;
  /** Quando true (default), redireciona para /upgrade ao bloquear; caso contrário renderiza fallback inline. */
  redirect?: boolean;
  fallback?: ReactNode;
}

/**
 * Gate de plano: só renderiza children se o plano vigente liberar o módulo.
 */
export function FeatureGate({ module, children, redirect = true, fallback }: FeatureGateProps) {
  const allowed = useHasModule(module);

  if (allowed === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  if (redirect) {
    return <Navigate to={`/upgrade?module=${encodeURIComponent(module)}`} replace />;
  }

  return (
    <>
      {fallback ?? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          Recurso não incluído no seu plano atual.
        </div>
      )}
    </>
  );
}
