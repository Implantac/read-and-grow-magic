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
import { RelacionamentoRoutes } from './routes/RelacionamentoRoutes';
import { FeatureGate } from '@/components/plan/FeatureGate';
import { GatedOutlet } from '@/components/plan/GatedOutlet';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { ConfirmDialogProvider } from '@/shared/components/ConfirmDialog';
import { ModuleErrorBoundary } from '@/shared/components/ModuleErrorBoundary';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { useLowMarginAlertsRealtime } from '@/hooks/commercial/useLowMarginAlertsRealtime';

const RealtimeAlertsBridge = () => {
  useLowMarginAlertsRealtime();
  return null;
};

// Eager load critical pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy load common pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
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
const SREOncall = lazy(() => import("./pages/SREOncall"));
const SREPostmortems = lazy(() => import("./pages/SREPostmortems"));
const MaturityAudit = lazy(() => import("./pages/MaturityAudit"));
const PluginMarketplace = lazy(() => import("./pages/PluginMarketplace"));
const PluginDetail = lazy(() => import("./pages/PluginDetail"));
const PluginEditor = lazy(() => import("./pages/admin/PluginEditor"));
const CommerceStorefronts = lazy(() => import("./pages/commerce/CommerceStorefronts"));
const CommerceStorefrontNew = lazy(() => import("./pages/commerce/CommerceStorefrontNew"));
const CommerceStorefrontDetail = lazy(() => import("./pages/commerce/CommerceStorefrontDetail"));
const CommerceStorefrontTheme = lazy(() => import("./pages/commerce/CommerceStorefrontTheme"));
const StorefrontCheckout = lazy(() => import("./pages/commerce/StorefrontCheckout"));
const StorefrontOrders = lazy(() => import("./pages/commerce/StorefrontOrders"));
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
const PurchaseOrders = lazy(() => import("./pages/purchasing/PurchaseOrders"));
const Suppliers = lazy(() => import("./pages/purchasing/Suppliers"));
const Quotations = lazy(() => import("./pages/purchasing/Quotations"));
const InventoryProducts = lazy(() => import("./pages/inventory/Products"));
const InventoryCategories = lazy(() => import("./pages/inventory/Categories"));
const InventoryMovements = lazy(() => import("./pages/inventory/Movements"));
const InventoryKardex = lazy(() => import("./pages/inventory/Kardex"));
const InventoryStockLevels = lazy(() => import("./pages/inventory/StockLevels"));
const CreditRiskDashboard = lazy(() => import("./pages/credit/RiskDashboard"));
const CreditAnalysis = lazy(() => import("./pages/credit/CreditAnalysis"));
const CreditOrderBlocks = lazy(() => import("./pages/credit/OrderBlocks"));
const CreditCollections = lazy(() => import("./pages/credit/Collections"));
const SuccessDashboard = lazy(() => import("./modules/success/SuccessDashboard"));
const SuccessProductsDetail = lazy(() => import("./modules/success/SuccessProductsDetail"));
const PublicNPS = lazy(() => import("./pages/PublicNPS"));



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
        <ConfirmDialogProvider>
          <Toaster />
          <Sonner />
          <RealtimeAlertsBridge />
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/nps/:token" element={<PublicNPS />} />
              <Route path="/loja/:slug/checkout" element={<StorefrontCheckout />} />

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
                <Route path="/sre/oncall" element={<SREOncall />} />
                <Route path="/sre/postmortems" element={<SREPostmortems />} />
                <Route path="/governanca/maturity" element={<MaturityAudit />} />
                <Route path="/marketplace" element={<PluginMarketplace />} />
                <Route path="/marketplace/:pluginId" element={<PluginDetail />} />
                <Route path="/admin/marketplace/editor" element={<PluginEditor />} />
                <Route path="/commerce/lojas" element={<CommerceStorefronts />} />
                <Route path="/commerce/lojas/nova" element={<CommerceStorefrontNew />} />
                <Route path="/commerce/lojas/:storefrontId" element={<CommerceStorefrontDetail />} />
                <Route path="/commerce/lojas/:storefrontId/tema" element={<CommerceStorefrontTheme />} />
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
                <Route path="/compras/pedidos" element={<PurchaseOrders />} />
                <Route path="/compras/fornecedores" element={<Suppliers />} />
                <Route path="/compras/cotacoes" element={<Quotations />} />
                <Route path="/estoque/produtos" element={<InventoryProducts />} />
                <Route path="/estoque/categorias" element={<InventoryCategories />} />
                <Route path="/estoque/movimentacoes" element={<InventoryMovements />} />
                <Route path="/estoque/kardex" element={<InventoryKardex />} />
                <Route path="/estoque/saldos" element={<InventoryStockLevels />} />
                <Route path="/estoque" element={<Navigate to="/estoque/produtos" replace />} />
                <Route path="/compras" element={<Navigate to="/compras/pedidos" replace />} />
                <Route path="/credito/dashboard" element={<RequirePermission resource="credit.risk" action="view"><CreditRiskDashboard /></RequirePermission>} />
                <Route path="/credito/analise" element={<RequirePermission resource="credit.risk" action="view"><CreditAnalysis /></RequirePermission>} />
                <Route path="/credito/bloqueios" element={<RequirePermission resource="credit.blocks" action="view"><CreditOrderBlocks /></RequirePermission>} />
                <Route path="/credito/cobranca" element={<RequirePermission resource="credit.collections" action="view"><CreditCollections /></RequirePermission>} />
                <Route path="/credito" element={<Navigate to="/credito/dashboard" replace />} />
                <Route path="/success" element={<ModuleErrorBoundary moduleName="Use Success"><SuccessDashboard /></ModuleErrorBoundary>} />
                <Route path="/success/produtos/:type" element={<ModuleErrorBoundary moduleName="Use Success"><SuccessProductsDetail /></ModuleErrorBoundary>} />



                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/subscribe" element={<Subscribe />} />

                <Route path="/comercial/*" element={<ModuleErrorBoundary moduleName="Comercial"><Routes>{CommercialRoutes}</Routes></ModuleErrorBoundary>} />
                <Route
                  path="/financeiro/*"
                  element={
                    <FeatureGate module="financeiro">
                      <ModuleErrorBoundary moduleName="Financeiro">
                        <Routes>{FinancialRoutes}</Routes>
                      </ModuleErrorBoundary>
                    </FeatureGate>
                  }
                />
                <Route path="/contabilidade/*" element={<ModuleErrorBoundary moduleName="Contábil"><Routes>{AccountingRoutes}</Routes></ModuleErrorBoundary>} />
                <Route path="/contabil/*" element={<Navigate to="/contabilidade" replace />} />
                <Route element={<GatedOutlet module="producao" />}>
                  <Route path="/producao/*" element={<ModuleErrorBoundary moduleName="Produção"><Routes>{ProductionRoutes}</Routes></ModuleErrorBoundary>} />
                </Route>
                <Route element={<GatedOutlet module="wms" />}>
                  <Route path="/wms/*" element={<ModuleErrorBoundary moduleName="WMS"><Routes>{WMSRoutes}</Routes></ModuleErrorBoundary>} />
                </Route>
                <Route path="/admin/*" element={<ModuleErrorBoundary moduleName="Admin"><Routes>{AdminRoutes}</Routes></ModuleErrorBoundary>} />
                {OperationalRoutes}
                {MiscellaneousRoutes}
                <Route element={<GatedOutlet module="fiscal" />}>
                  <Route path="/fiscal/*" element={<ModuleErrorBoundary moduleName="Fiscal"><Routes>{FiscalRoutes}</Routes></ModuleErrorBoundary>} />
                </Route>
                {VerticalPackRoutes}
                <Route path="/executive/*" element={<ModuleErrorBoundary moduleName="Executivo"><Routes>{ExecutiveRoutes}</Routes></ModuleErrorBoundary>} />
                <Route path="/relacionamento/*" element={<ModuleErrorBoundary moduleName="Relacionamento"><Routes>{RelacionamentoRoutes}</Routes></ModuleErrorBoundary>} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </ConfirmDialogProvider>
      </EnterpriseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;