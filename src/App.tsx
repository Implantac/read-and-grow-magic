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

// Centralized Routing System (EOE optimized)
import AppRoutes from './routes/index';

const RealtimeAlertsBridge = React.memo(() => {
  const { currentCompany } = useEnterprise();
  
  // Scoped hooks only run when a company is active
  useLowMarginAlertsRealtime();
  useInventoryOrchestrator();
  useFinancialOrchestrator();
  
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
          <Toaster />
          <Sonner />
          <RealtimeAlertsBridge />
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
