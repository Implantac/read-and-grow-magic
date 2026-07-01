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
import { FeatureGate } from '@/components/plan/FeatureGate';
import { GatedOutlet } from '@/components/plan/GatedOutlet';
import { OnboardingGuard } from '@/components/OnboardingGuard';

// Eager load critical pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy load common pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const DashboardView = lazy(() => import("./pages/DashboardView"));
const CustomEntityRecords = lazy(() => import("./pages/CustomEntityRecords"));
const WorkflowInbox = lazy(() => import("./pages/WorkflowInbox"));
const MyApprovals = lazy(() => import("./pages/MyApprovals"));
const WorkflowDelegations = lazy(() => import("./pages/WorkflowDelegations"));
const Observability = lazy(() => import("./pages/Observability"));
const SRESettings = lazy(() => import("./pages/SRESettings"));
const SLODashboard = lazy(() => import("./pages/SLODashboard"));
const MaturityAudit = lazy(() => import("./pages/MaturityAudit"));
const PluginMarketplace = lazy(() => import("./pages/PluginMarketplace"));
const PluginEditor = lazy(() => import("./pages/admin/PluginEditor"));
const ConstructionProjects = lazy(() => import("./pages/ConstructionProjects"));
const ConstructionProjectDetail = lazy(() => import("./pages/ConstructionProjectDetail"));
const AgroFarms = lazy(() => import("./pages/AgroFarms"));
const AgroFarmDetail = lazy(() => import("./pages/AgroFarmDetail"));
const HealthPatients = lazy(() => import("./pages/HealthPatients"));
const HealthPatientDetail = lazy(() => import("./pages/HealthPatientDetail"));
const BillingUsage = lazy(() => import("./pages/BillingUsage"));
const EducationDashboard = lazy(() => import("./pages/EducationDashboard"));
const ColetorLayout = lazy(() => import("./coletor/ColetorLayout"));
const ColetorHome = lazy(() => import("./coletor/ColetorHome"));
const ColetorReceiving = lazy(() => import("./coletor/ColetorReceiving"));
const ColetorPutaway = lazy(() => import("./coletor/ColetorPutaway"));
const ColetorPicking = lazy(() => import("./coletor/ColetorPicking"));
const ProfileSecurity = lazy(() => import("./pages/profile/Security"));
const ProfilePrivacy = lazy(() => import("./pages/profile/Privacy"));
const PurchaseApprovals = lazy(() => import("./pages/purchasing/PurchaseApprovals"));
const PurchaseApprovalsMetrics = lazy(() => import("./pages/purchasing/PurchaseApprovalsMetrics"));



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
              <Route path="/onboarding" element={<Onboarding />} />

              <Route path="/coletor" element={<ColetorLayout />}>
                <Route index element={<ColetorHome />} />
                <Route path="recebimento" element={<ColetorReceiving />} />
                <Route path="putaway" element={<ColetorPutaway />} />
                <Route path="picking" element={<ColetorPicking />} />
              </Route>

              <Route element={<MainLayout />}>
                <Route element={<OnboardingGuard />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboards/:id" element={<DashboardView />} />
                <Route path="/custom/:entityKey" element={<CustomEntityRecords />} />
                <Route path="/workflows/inbox" element={<WorkflowInbox />} />
                <Route path="/workflows/aprovacoes" element={<MyApprovals />} />
                <Route path="/workflows/delegacoes" element={<WorkflowDelegations />} />
                <Route path="/sre" element={<Observability />} />
                <Route path="/sre/configuracao" element={<SRESettings />} />
                <Route path="/sre/slo" element={<SLODashboard />} />
                <Route path="/governanca/maturity" element={<MaturityAudit />} />
                <Route path="/marketplace" element={<PluginMarketplace />} />
                <Route path="/admin/marketplace/editor" element={<PluginEditor />} />
                <Route path="/construcao/obras" element={<ConstructionProjects />} />
                <Route path="/construcao/obras/:id" element={<ConstructionProjectDetail />} />
                <Route path="/agro/fazendas" element={<AgroFarms />} />
                <Route path="/agro/fazendas/:id" element={<AgroFarmDetail />} />
                <Route path="/saude/pacientes" element={<HealthPatients />} />
                <Route path="/saude/pacientes/:id" element={<HealthPatientDetail />} />
                <Route path="/educacao" element={<EducationDashboard />} />
                <Route path="/billing/consumo" element={<BillingUsage />} />
                <Route path="/perfil/seguranca" element={<ProfileSecurity />} />
                <Route path="/perfil/privacidade" element={<ProfilePrivacy />} />
                <Route path="/compras/aprovacoes" element={<PurchaseApprovals />} />
                <Route path="/compras/aprovacoes/indicadores" element={<PurchaseApprovalsMetrics />} />


                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/subscribe" element={<Subscribe />} />

                {CommercialRoutes}
                <Route
                  path="/financeiro/*"
                  element={
                    <FeatureGate module="financeiro">
                      <Routes>{FinancialRoutes}</Routes>
                    </FeatureGate>
                  }
                />
                {AccountingRoutes}
                <Route element={<GatedOutlet module="producao" />}>{ProductionRoutes}</Route>
                <Route element={<GatedOutlet module="wms" />}>{WMSRoutes}</Route>
                {AdminRoutes}
                {OperationalRoutes}
                {MiscellaneousRoutes}
                <Route element={<GatedOutlet module="fiscal" />}>{FiscalRoutes}</Route>
                {VerticalPackRoutes}
                {ExecutiveRoutes}
                </Route>
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