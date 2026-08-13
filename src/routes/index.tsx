import { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { MainLayout } from '@/core/layout/MainLayout';
import { ModuleErrorBoundary } from '@/shared/components/ModuleErrorBoundary';

// Critical Pages - Eager Load to prevent white screens on initial entry
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

// Route Collections - These export arrays of Route elements
import { CommercialRoutes } from './CommercialRoutes';
import { FinancialRoutes } from './FinancialRoutes';
import { OperationalRoutes } from './OperationalRoutes';
import { AdminRoutes } from './AdminRoutes';
import { FiscalRoutes } from './FiscalRoutes';
import { AccountingRoutes } from './AccountingRoutes';
import { ProductionRoutes } from './ProductionRoutes';
import { WMSRoutes } from './WMSRoutes';
import { RelacionamentoRoutes } from './RelacionamentoRoutes';
import { NetworkRoutes } from './NetworkRoutes';

// Domain-Specific Lazy Components
const UnifiedSupplyChain = lazy(() => import('@/modules/operational/supply-chain/UnifiedSupplyChain'));
const StoreCentral = lazy(() => import('@/modules/operational/store/StoreCentral'));
const ManualModule = lazy(() => import('@/modules/admin/systemManual/SystemManual'));

/**
 * Performance-optimized Page Loader
 * Centralized loading state for all lazy-loaded routes
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
 * Centralizes all application routing with performance best practices:
 * 1. Code Splitting (Lazy Loading)
 * 2. Error Boundaries per Module
 * 3. Protected Context (MainLayout & OnboardingGuard)
 * 4. Memoized Route Tree
 */
const AppRoutes = () => {
  const routes = useMemo(() => (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Layout Scope */}
      <Route element={<MainLayout />}>
        <Route element={<OnboardingGuard />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          {/* Commercial Domain */}
          <Route path="/comercial/*" element={
            <ModuleErrorBoundary moduleName="Comercial">
              <Routes>{CommercialRoutes}</Routes>
            </ModuleErrorBoundary>
          } />
          
          {/* Financial Domain */}
          <Route path="/financeiro/*" element={
            <ModuleErrorBoundary moduleName="Financeiro">
              <Routes>{FinancialRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Logistics & WMS Domain */}
          <Route path="/wms/*" element={
            <ModuleErrorBoundary moduleName="WMS">
              <Routes>{WMSRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Operational & Supply Chain Domain */}
          <Route path="/operacional/abastecimento" element={
            <Suspense fallback={<PageLoader />}>
              <UnifiedSupplyChain />
            </Suspense>
          } />
          <Route path="/operacional/loja/central" element={
            <Suspense fallback={<PageLoader />}>
              <StoreCentral />
            </Suspense>
          } />
          <Route path="/operacional/rede/*" element={
            <ModuleErrorBoundary moduleName="Rede">
              <Routes>{NetworkRoutes}</Routes>
            </ModuleErrorBoundary>
          } />
          <Route path="/operacional/*" element={
            <ModuleErrorBoundary moduleName="Operacional">
              <Routes>{OperationalRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Accounting Domain */}
          <Route path="/contabilidade/*" element={
            <ModuleErrorBoundary moduleName="Contábil">
              <Routes>{AccountingRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Production Domain */}
          <Route path="/producao/*" element={
            <ModuleErrorBoundary moduleName="Produção">
              <Routes>{ProductionRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Fiscal Domain */}
          <Route path="/fiscal/*" element={
            <ModuleErrorBoundary moduleName="Fiscal">
              <Routes>{FiscalRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Relationship (CRM/NPS) Domain */}
          <Route path="/relacionamento/*" element={
            <ModuleErrorBoundary moduleName="Relacionamento">
              <Routes>{RelacionamentoRoutes}</Routes>
            </ModuleErrorBoundary>
          } />

          {/* Administration & Governance Domain */}
          <Route path="/admin/manual" element={
            <Suspense fallback={<PageLoader />}>
              <ManualModule />
            </Suspense>
          } />
          <Route path="/admin/*" element={
            <ModuleErrorBoundary moduleName="Admin">
              <Routes>{AdminRoutes}</Routes>
            </ModuleErrorBoundary>
          } />
        </Route>
      </Route>

      {/* 404 & Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  ), []);

  return (
    <Suspense fallback={<PageLoader />}>
      {routes}
    </Suspense>
  );
};

export default AppRoutes;
