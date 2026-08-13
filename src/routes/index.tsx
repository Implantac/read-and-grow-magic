import { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AppLayout } from '@/shared/layouts/AppLayout';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

// Critical Pages - Eager Load
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

// Lazy Load Modules for Better Performance & Code Splitting
const OperationalRoutes = lazy(() => import('./OperationalRoutes').then(m => ({ default: m.OperationalRoutes })));
const FinancialRoutes = lazy(() => import('./FinancialRoutes').then(m => ({ default: m.FinancialRoutes })));
const InventoryModule = lazy(() => import('@/modules/inventory/InventoryModule'));
const SalesModule = lazy(() => import('@/modules/sales/SalesModule'));
const PurchasingModule = lazy(() => import('@/modules/purchasing/PurchasingModule'));
const ProductionModule = lazy(() => import('@/modules/production/ProductionModule'));
const WMSModule = lazy(() => import('@/modules/wms/WMSModule'));
const RelationshipModule = lazy(() => import('@/modules/relationship/RelationshipModule'));
const AdminRoutes = lazy(() => import('./AdminRoutes').then(m => ({ default: m.AdminRoutes })));
const FiscalRoutes = lazy(() => import('./FiscalRoutes').then(m => ({ default: m.FiscalRoutes })));
const UnifiedSupplyChain = lazy(() => import('@/modules/operational/supply-chain/UnifiedSupplyChain'));
const StoreCentral = lazy(() => import('@/modules/operational/store/StoreCentral'));
const ManualModule = lazy(() => import('@/modules/admin/systemManual/SystemManual'));

/**
 * Performance-optimized Page Loader with backdrop blur and smooth animation
 */
const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-300">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-80" />
      <p className="text-sm font-medium animate-pulse text-muted-foreground tracking-wide">
        Sincronizando Ecossistema...
      </p>
    </div>
  </div>
);

/**
 * Enterprise Operating Ecosystem (EOE) Optimized Router
 * Implements route-based code splitting and centralized error handling.
 */
const AppRoutes = () => {
  // Memoize routes to prevent unnecessary re-renders of the route tree
  const routes = useMemo(() => (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        {/* Domain: Operational & Logistics */}
        <Route path="/operacional/*" element={<Suspense fallback={<PageLoader />}><Routes>{OperationalRoutes as any}</Routes></Suspense>} />
        <Route path="/operacional/abastecimento" element={<Suspense fallback={<PageLoader />}><UnifiedSupplyChain /></Suspense>} />
        <Route path="/operacional/loja/central" element={<Suspense fallback={<PageLoader />}><StoreCentral /></Suspense>} />
        
        {/* Domain: Business Intelligence & Execution */}
        <Route path="/financeiro/*" element={<Suspense fallback={<PageLoader />}><Routes>{FinancialRoutes as any}</Routes></Suspense>} />
        <Route path="/estoque/*" element={<Suspense fallback={<PageLoader />}><InventoryModule /></Suspense>} />
        <Route path="/comercial/*" element={<Suspense fallback={<PageLoader />}><SalesModule /></Suspense>} />
        <Route path="/compras/*" element={<Suspense fallback={<PageLoader />}><PurchasingModule /></Suspense>} />
        <Route path="/producao/*" element={<Suspense fallback={<PageLoader />}><ProductionModule /></Suspense>} />
        <Route path="/wms/*" element={<Suspense fallback={<PageLoader />}><WMSModule /></Suspense>} />
        
        {/* Domain: Relationship & Compliance */}
        <Route path="/relacionamento/*" element={<Suspense fallback={<PageLoader />}><RelationshipModule /></Suspense>} />
        <Route path="/fiscal/*" element={<Suspense fallback={<PageLoader />}><Routes>{FiscalRoutes as any}</Routes></Suspense>} />
        
        {/* Domain: Administration & Governance */}
        <Route path="/admin/*" element={<Suspense fallback={<PageLoader />}><Routes>{AdminRoutes as any}</Routes></Suspense>} />
        <Route path="/admin/manual" element={<Suspense fallback={<PageLoader />}><ManualModule /></Suspense>} />
      </Route>

      {/* Fallback for undefined routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  ), []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {routes}
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
