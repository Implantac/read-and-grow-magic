import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/modules/dashboard/Dashboard';
import Login from '@/modules/auth/Login';
import Register from '@/modules/auth/Register';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AppLayout } from '@/shared/layouts/AppLayout';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

// Lazy load modules for better performance
const OperationalModule = lazy(() => import('@/modules/operational/OperationalModule'));
const FinancialModule = lazy(() => import('@/modules/financial/FinancialModule'));
const InventoryModule = lazy(() => import('@/modules/inventory/InventoryModule'));
const SalesModule = lazy(() => import('@/modules/sales/SalesModule'));
const PurchasingModule = lazy(() => import('@/modules/purchasing/PurchasingModule'));
const ProductionModule = lazy(() => import('@/modules/production/ProductionModule'));
const WMSModule = lazy(() => import('@/modules/wms/WMSModule'));
const TMSModule = lazy(() => import('@/modules/tms/TMSModule'));
const RelationshipModule = lazy(() => import('@/modules/relationship/RelationshipModule'));
const AdminModule = lazy(() => import('@/modules/admin/AdminModule'));
const FiscalModule = lazy(() => import('@/modules/fiscal/FiscalModule'));
const NetworkArchitecture = lazy(() => import('@/modules/operational/network/NetworkArchitecture'));
const UnifiedSupplyChain = lazy(() => import('@/modules/operational/supply-chain/UnifiedSupplyChain'));
const StoreCentral = lazy(() => import('@/modules/operational/store/StoreCentral'));
const ManualModule = lazy(() => import('@/modules/admin/systemManual/SystemManual'));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background/50 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-xl" />
      <p className="text-sm font-medium animate-pulse text-muted-foreground">Carregando ecossistema...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            
            {/* Operational Domain */}
            <Route path="/operacional/*" element={<OperationalModule />} />
            <Route path="/operacional/rede" element={<NetworkArchitecture />} />
            <Route path="/operacional/abastecimento" element={<UnifiedSupplyChain />} />
            <Route path="/operacional/loja/central" element={<StoreCentral />} />
            
            {/* Business Domains */}
            <Route path="/financeiro/*" element={<FinancialModule />} />
            <Route path="/estoque/*" element={<InventoryModule />} />
            <Route path="/comercial/*" element={<SalesModule />} />
            <Route path="/compras/*" element={<PurchasingModule />} />
            <Route path="/producao/*" element={<ProductionModule />} />
            <Route path="/wms/*" element={<WMSModule />} />
            <Route path="/tms/*" element={<TMSModule />} />
            <Route path="/relacionamento/*" element={<RelationshipModule />} />
            <Route path="/fiscal/*" element={<FiscalModule />} />
            
            {/* Administrative Domain */}
            <Route path="/admin/*" element={<AdminModule />} />
            <Route path="/admin/manual" element={<ManualModule />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
