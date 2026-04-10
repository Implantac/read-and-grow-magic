import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Loader2 } from 'lucide-react';

// Eager load critical pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy load all other pages
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Commercial
const ClientsPage = lazy(() => import("./pages/comercial/Clients"));
const SalesPage = lazy(() => import("./pages/comercial/Sales"));
const OrdersPage = lazy(() => import("./pages/comercial/Orders"));
const CommercialQuotationsPage = lazy(() => import("./pages/comercial/Quotations"));
const CommercialDashboardPage = lazy(() => import("./pages/comercial/CommercialDashboard"));
const SalesFunnelPage = lazy(() => import("./pages/comercial/SalesFunnel"));
const SalesRepsPage = lazy(() => import("./pages/comercial/SalesReps"));
const CommissionsPage = lazy(() => import("./pages/comercial/Commissions"));
const SalesTargetsPage = lazy(() => import("./pages/comercial/SalesTargets"));
const ForecastPage = lazy(() => import("./pages/comercial/Forecast"));

// Credit & Risk
const CreditAnalysisPage = lazy(() => import("./pages/credito/CreditAnalysis"));
const OrderBlocksPage = lazy(() => import("./pages/credito/OrderBlocks"));
const CollectionsPage = lazy(() => import("./pages/credito/Collections"));
const RiskDashboardPage = lazy(() => import("./pages/credito/RiskDashboard"));

// Financial
const AccountsPayable = lazy(() => import("./pages/financeiro/AccountsPayable"));
const AccountsReceivable = lazy(() => import("./pages/financeiro/AccountsReceivable"));
const CashFlow = lazy(() => import("./pages/financeiro/CashFlow"));
const BankReconciliation = lazy(() => import("./pages/financeiro/BankReconciliation"));

// Accounting
const ChartOfAccountsPage = lazy(() => import("./pages/contabilidade/ChartOfAccounts"));
const JournalEntriesPage = lazy(() => import("./pages/contabilidade/JournalEntries"));
const GeneralLedgerPage = lazy(() => import("./pages/contabilidade/GeneralLedger"));
const TrialBalancePage = lazy(() => import("./pages/contabilidade/TrialBalance"));
const DREPage = lazy(() => import("./pages/contabilidade/DRE"));
const BalanceSheetPage = lazy(() => import("./pages/contabilidade/BalanceSheet"));
const AccountingDashboardPage = lazy(() => import("./pages/contabilidade/AccountingDashboard"));

// Fiscal
const NFePage = lazy(() => import("./pages/fiscal/NFe"));
const NFCePage = lazy(() => import("./pages/fiscal/NFCe"));
const FiscalReportsPage = lazy(() => import("./pages/fiscal/FiscalReports"));

// Inventory
const InventoryProductsPage = lazy(() => import("./pages/estoque/Products"));
const InventoryMovementsPage = lazy(() => import("./pages/estoque/Movements"));
const KardexPage = lazy(() => import("./pages/estoque/Kardex"));
const StockLevelsPage = lazy(() => import("./pages/estoque/StockLevels"));
const CategoriesPage = lazy(() => import("./pages/estoque/Categories"));

// WMS
const WMSDashboardPage = lazy(() => import("./pages/wms/Dashboard"));
const ReceivingPage = lazy(() => import("./pages/wms/Receiving"));
const StoragePage = lazy(() => import("./pages/wms/Storage"));
const PickingPage = lazy(() => import("./pages/wms/Picking"));
const PackingPage = lazy(() => import("./pages/wms/Packing"));
const InventoryPage = lazy(() => import("./pages/wms/Inventory"));
const WMSMovementsPage = lazy(() => import("./pages/wms/Movements"));

// RFID
const RFIDDashboardPage = lazy(() => import("./pages/rfid/Dashboard"));
const RFIDReadersPage = lazy(() => import("./pages/rfid/Readers"));
const RFIDTagsPage = lazy(() => import("./pages/rfid/Tags"));
const RFIDEventsPage = lazy(() => import("./pages/rfid/Events"));
const RFIDIntegrationPage = lazy(() => import("./pages/rfid/Integration"));

// Production
const ProductionOrdersPage = lazy(() => import("./pages/producao/ProductionOrders"));
const MaterialConsumptionPage = lazy(() => import("./pages/producao/MaterialConsumption"));
const TimeEntriesPage = lazy(() => import("./pages/producao/TimeEntries"));
const PCPPanelPage = lazy(() => import("./pages/producao/PCPPanel"));

// Operational Flow
const OperationalDashboardPage = lazy(() => import("./pages/operacional/OperationalDashboard"));
const OrderTrackingPage = lazy(() => import("./pages/operacional/OrderTracking"));
const SeparationQueuePage = lazy(() => import("./pages/operacional/SeparationQueue"));
const ConferenceQueuePage = lazy(() => import("./pages/operacional/ConferenceQueue"));
const BillingQueuePage = lazy(() => import("./pages/operacional/BillingQueue"));
const ShipmentPage = lazy(() => import("./pages/operacional/ShipmentPage"));

// Purchasing
const SuppliersPage = lazy(() => import("./pages/compras/Suppliers"));
const PurchaseOrdersPage = lazy(() => import("./pages/compras/PurchaseOrders"));
const QuotationsPage = lazy(() => import("./pages/compras/Quotations"));

// Reports
const SalesReport = lazy(() => import("./pages/relatorios/SalesReport"));
const InventoryReport = lazy(() => import("./pages/relatorios/InventoryReport"));
const FinancialReport = lazy(() => import("./pages/relatorios/FinancialReport"));
const ProductionReport = lazy(() => import("./pages/relatorios/ProductionReport"));

// Administration
const UsersPage = lazy(() => import("./pages/admin/Users"));
const CompaniesPage = lazy(() => import("./pages/admin/Companies"));
const ParametersPage = lazy(() => import("./pages/admin/Parameters"));

// Profile & Notifications
const ProfilePage = lazy(() => import("./pages/Profile"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));

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
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CommandPalette />
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/reset-password"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ResetPassword />
                </Suspense>
              }
            />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Commercial Module */}
              <Route path="/comercial/dashboard" element={<CommercialDashboardPage />} />
              <Route path="/comercial/clientes" element={<ClientsPage />} />
              <Route path="/comercial/vendas" element={<SalesPage />} />
              <Route path="/comercial/pedidos" element={<OrdersPage />} />
              <Route path="/comercial/orcamentos" element={<CommercialQuotationsPage />} />
              <Route path="/comercial/funil" element={<SalesFunnelPage />} />
              <Route path="/comercial/representantes" element={<SalesRepsPage />} />
              <Route path="/comercial/comissoes" element={<CommissionsPage />} />
              <Route path="/comercial/metas" element={<SalesTargetsPage />} />
              <Route path="/comercial/forecast" element={<ForecastPage />} />
              
              {/* Financial Module */}
              <Route path="/financeiro/pagar" element={<AccountsPayable />} />
              <Route path="/financeiro/receber" element={<AccountsReceivable />} />
              <Route path="/financeiro/fluxo" element={<CashFlow />} />
              <Route path="/financeiro/conciliacao" element={<BankReconciliation />} />
              
              {/* Credit & Risk Module */}
              <Route path="/credito/dashboard" element={<RiskDashboardPage />} />
              <Route path="/credito/analise" element={<CreditAnalysisPage />} />
              <Route path="/credito/bloqueios" element={<OrderBlocksPage />} />
              <Route path="/credito/cobranca" element={<CollectionsPage />} />
              
              {/* Accounting Module */}
              <Route path="/contabilidade/painel" element={<AccountingDashboardPage />} />
              <Route path="/contabilidade/plano-contas" element={<ChartOfAccountsPage />} />
              <Route path="/contabilidade/lancamentos" element={<JournalEntriesPage />} />
              <Route path="/contabilidade/razao" element={<GeneralLedgerPage />} />
              <Route path="/contabilidade/balancete" element={<TrialBalancePage />} />
              <Route path="/contabilidade/dre" element={<DREPage />} />
              <Route path="/contabilidade/balanco" element={<BalanceSheetPage />} />

              {/* Fiscal Module */}
              <Route path="/fiscal/nfe" element={<NFePage />} />
              <Route path="/fiscal/nfce" element={<NFCePage />} />
              <Route path="/fiscal/relatorios" element={<FiscalReportsPage />} />

              {/* Inventory Module */}
              <Route path="/estoque/produtos" element={<InventoryProductsPage />} />
              <Route path="/estoque/movimentacoes" element={<InventoryMovementsPage />} />
              <Route path="/estoque/kardex" element={<KardexPage />} />
              <Route path="/estoque/saldos" element={<StockLevelsPage />} />
              <Route path="/estoque/categorias" element={<CategoriesPage />} />
              
              {/* Purchasing Module */}
              <Route path="/compras/fornecedores" element={<SuppliersPage />} />
              <Route path="/compras/pedidos" element={<PurchaseOrdersPage />} />
              <Route path="/compras/cotacoes" element={<QuotationsPage />} />
              
              {/* Production Module */}
              <Route path="/producao/pcp" element={<PCPPanelPage />} />
              <Route path="/producao/ordens" element={<ProductionOrdersPage />} />
              <Route path="/producao/consumo" element={<MaterialConsumptionPage />} />
              <Route path="/producao/apontamentos" element={<TimeEntriesPage />} />

              {/* Operational Flow Module */}
              <Route path="/operacional/dashboard" element={<OperationalDashboardPage />} />
              <Route path="/operacional/acompanhamento" element={<OrderTrackingPage />} />
              <Route path="/operacional/separacao" element={<SeparationQueuePage />} />
              <Route path="/operacional/conferencia" element={<ConferenceQueuePage />} />
              <Route path="/operacional/faturamento" element={<BillingQueuePage />} />
              <Route path="/operacional/expedicao" element={<ShipmentPage />} />
              
              {/* WMS Module */}
              <Route path="/wms/dashboard" element={<WMSDashboardPage />} />
              <Route path="/wms/recebimento" element={<ReceivingPage />} />
              <Route path="/wms/enderecamento" element={<StoragePage />} />
              <Route path="/wms/picking" element={<PickingPage />} />
              <Route path="/wms/packing" element={<PackingPage />} />
              <Route path="/wms/inventario" element={<InventoryPage />} />
              <Route path="/wms/movimentacoes" element={<WMSMovementsPage />} />
              
              {/* RFID Module */}
              <Route path="/rfid/dashboard" element={<RFIDDashboardPage />} />
              <Route path="/rfid/leitores" element={<RFIDReadersPage />} />
              <Route path="/rfid/tags" element={<RFIDTagsPage />} />
              <Route path="/rfid/eventos" element={<RFIDEventsPage />} />
              <Route path="/rfid/integracao" element={<RFIDIntegrationPage />} />
              
              {/* Reports Module */}
              <Route path="/relatorios/vendas" element={<SalesReport />} />
              <Route path="/relatorios/estoque" element={<InventoryReport />} />
              <Route path="/relatorios/financeiro" element={<FinancialReport />} />
              <Route path="/relatorios/producao" element={<ProductionReport />} />

              {/* Administration Module */}
              <Route path="/admin/usuarios" element={<UsersPage />} />
              <Route path="/admin/empresas" element={<CompaniesPage />} />
              <Route path="/admin/parametros" element={<ParametersPage />} />

              {/* Profile & Notifications */}
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
              
              {/* Config - Placeholder routes */}
              <Route path="/config/*" element={<PlaceholderPage title="Configurações" />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              }
            />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          Este módulo será implementado nas próximas fases.
        </p>
      </div>
    </div>
  );
}

export default App;
