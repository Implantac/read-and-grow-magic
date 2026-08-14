import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/ui/base/toaster";
import { Toaster as Sonner } from "@/ui/base/sonner";
import { TooltipProvider } from "@/ui/base/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { EnterpriseProvider, useEnterprise } from "@/core/auth/EnterpriseContext";
import { Loader2 } from 'lucide-react';
import { ConfirmDialogProvider } from '@/shared/components/ConfirmDialog';
import { useLowMarginAlertsRealtime } from '@/hooks/commercial/useLowMarginAlertsRealtime';
import { WorkflowSwitcher } from '@/modules/core/components/WorkflowSwitcher';
import { useInventoryOrchestrator } from '@/core/orchestration/InventoryOrchestrator';
import { useFinancialOrchestrator } from '@/core/orchestration/FinancialOrchestrator';

import { withRenderMonitor } from '@/core/debug/RenderDepthMonitor';

// Centralized Routing System (EOE optimized)
const AppRoutes = React.memo(lazy(() => import('./routes/index')));

const RealtimeAlertsBridge = React.memo(() => {
  const enterprise = useEnterprise();
  const companyId = enterprise.currentCompany?.id;
  
  // Decouple orchestrator mounting from immediate render to prevent synchronous state cycles
  const [shouldMount, setShouldMount] = React.useState(false);

  React.useEffect(() => {
    if (!enterprise.isLoading && companyId) {
      const timer = setTimeout(() => setShouldMount(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShouldMount(false);
    }
  }, [enterprise.isLoading, companyId]);

  if (!shouldMount || !companyId) return null;

  return <OrchestratorInternal companyId={companyId} />;
});

const OrchestratorInternal = React.memo(({ companyId }: { companyId: string }) => {
  useLowMarginAlertsRealtime(companyId);
  useInventoryOrchestrator(companyId);
  useFinancialOrchestrator(companyId);
  return null;
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
    },
  },
});

function GlobalLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse text-muted-foreground">Inicializando Ecossistema...</p>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EnterpriseProvider>
        <ConfirmDialogProvider>
          <RealtimeAlertsBridge />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WorkflowSwitcher />
            <Suspense fallback={<GlobalLoader />}>
              <AppRoutes />
            </Suspense>
          </BrowserRouter>
        </ConfirmDialogProvider>
      </EnterpriseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
