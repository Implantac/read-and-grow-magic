import { lazy, Suspense } from 'react';
import { Toaster } from "@/ui/base/toaster";
import { Toaster as Sonner } from "@/ui/base/sonner";
import { TooltipProvider } from "@/ui/base/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/core/layout/MainLayout";
import { Loader2 } from 'lucide-react';
import { EnterpriseProvider } from "@/core/auth/EnterpriseContext";

// Routes
import { CommercialRoutes } from './routes/CommercialRoutes';
import { FinancialRoutes } from './routes/FinancialRoutes';
import { AccountingRoutes } from './routes/AccountingRoutes';
import { ProductionRoutes } from './routes/ProductionRoutes';
import { WMSRoutes } from './routes/WMSRoutes';
import { AdminRoutes } from './routes/AdminRoutes';
import { OperationalRoutes } from './routes/OperationalRoutes';
import { MiscellaneousRoutes } from './routes/MiscellaneousRoutes';
import { FiscalRoutes } from './routes/FiscalRoutes';
import { VerticalPackRoutes } from './core/routes/VerticalPackRoutes';
import { ExecutiveRoutes } from './routes/ExecutiveRoutes';

// Eager load critical pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy load common pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EnterpriseProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                {CommercialRoutes}
                <Route path="/financeiro/*" element={<Routes>{FinancialRoutes}</Routes>} />
                {AccountingRoutes}
                {ProductionRoutes}
                {WMSRoutes}
                {AdminRoutes}
                {OperationalRoutes}
                {MiscellaneousRoutes}
                {FiscalRoutes}
                {VerticalPackRoutes}
                {ExecutiveRoutes}
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </EnterpriseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;