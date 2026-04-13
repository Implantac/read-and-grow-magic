import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
const SellerDashboardPage = lazy(() => import("./pages/comercial/SellerDashboard"));
const CampaignsPage = lazy(() => import("./pages/comercial/Campaigns"));
const PerformanceDashboardPage = lazy(() => import("./pages/comercial/PerformanceDashboard"));
const AICommercialDashboardPage = lazy(() => import("./pages/comercial/AICommercialDashboard"));
const SalesExecutionPage = lazy(() => import("./pages/comercial/SalesExecution"));
const PlaybookPage = lazy(() => import("./pages/comercial/Playbook"));
const GamificationPage = lazy(() => import("./pages/comercial/Gamification"));
const SalesAutomationPage = lazy(() => import("./pages/comercial/SalesAutomation"));
const ExecutiveDashboardPage = lazy(() => import("./pages/diretoria/ExecutiveDashboard"));

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
const FinancialDashboardPage = lazy(() => import("./pages/financeiro/FinancialDashboard"));
const BankAccountsPage = lazy(() => import("./pages/financeiro/BankAccounts"));
const CostCentersPage = lazy(() => import("./pages/financeiro/CostCenters"));
const RenegotiationsPage = lazy(() => import("./pages/financeiro/Renegotiations"));

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
const ConferencePage = lazy(() => import("./pages/wms/Conference"));
const ShipmentsPage = lazy(() => import("./pages/wms/Shipments"));
const LotsPage = lazy(() => import("./pages/wms/Lots"));
const WavesPage = lazy(() => import("./pages/wms/Waves"));
const PutawayPage = lazy(() => import("./pages/wms/Putaway"));
const ReplenishmentPage = lazy(() => import("./pages/wms/Replenishment"));
const ReturnsPage = lazy(() => import("./pages/wms/Returns"));
const DistributionCentersPage = lazy(() => import("./pages/wms/DistributionCenters"));
const StockBalancesPage = lazy(() => import("./pages/wms/StockBalances"));
const DocksPage = lazy(() => import("./pages/wms/Docks"));
const WMSAIPage = lazy(() => import("./pages/wms/WMSAI"));

// RFID
const RFIDDashboardPage = lazy(() => import("./pages/rfid/Dashboard"));
const RFIDReadersPage = lazy(() => import("./pages/rfid/Readers"));
const RFIDTagsPage = lazy(() => import("./pages/rfid/Tags"));
const RFIDEventsPage = lazy(() => import("./pages/rfid/Events"));
const RFIDIntegrationPage = lazy(() => import("./pages/rfid/Integration"));

// TMS
const TMSDashboardPage = lazy(() => import("./pages/tms/TMSDashboard"));
const CarriersPage = lazy(() => import("./pages/tms/Carriers"));
const VehiclesPage = lazy(() => import("./pages/tms/Vehicles"));
const RoutesPage = lazy(() => import("./pages/tms/Routes"));
const DeliveryProofPage = lazy(() => import("./pages/tms/DeliveryProof"));


const ProductionOrdersPage = lazy(() => import("./pages/producao/ProductionOrders"));
const MaterialConsumptionPage = lazy(() => import("./pages/producao/MaterialConsumption"));
const TimeEntriesPage = lazy(() => import("./pages/producao/TimeEntries"));
const PCPPanelPage = lazy(() => import("./pages/producao/PCPPanel"));
const ProductionStepsPage = lazy(() => import("./pages/producao/ProductionSteps"));
const ProductionQueuePage = lazy(() => import("./pages/producao/ProductionQueue"));
const QualityControlPage = lazy(() => import("./pages/producao/QualityControl"));
const SupplyStockPage = lazy(() => import("./pages/producao/SupplyStock"));
const ProductCostsPage = lazy(() => import("./pages/producao/ProductCosts"));
const IndustrialDashboardPage = lazy(() => import("./pages/producao/IndustrialDashboard"));
const OperatorTerminalPage = lazy(() => import("./pages/producao/OperatorTerminal"));
const ShopFloorDashboardPage = lazy(() => import("./pages/producao/ShopFloorDashboard"));
const ProductionKanbanPage = lazy(() => import("./pages/producao/ProductionKanban"));
const TechnicalSheetsPage = lazy(() => import("./pages/producao/TechnicalSheets"));
const ProductionCapacityPage = lazy(() => import("./pages/producao/ProductionCapacity"));
const ProductionTraceabilityPage = lazy(() => import("./pages/producao/ProductionTraceability"));
const AIProductionPage = lazy(() => import("./pages/producao/AIProductionPage"));
const ProductionSchedulePage = lazy(() => import("./pages/producao/ProductionSchedule"));
const MRPPage = lazy(() => import("./pages/producao/MRPPage"));

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
const SuperAdminPage = lazy(() => import("./pages/admin/SuperAdmin"));

// SaaS
const LandingPage = lazy(() => import("./pages/LandingPage"));

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
              <Route path="/diretoria/executive" element={<ExecutiveDashboardPage />} />
              
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
              <Route path="/comercial/vendedor" element={<SellerDashboardPage />} />
              <Route path="/comercial/campanhas" element={<CampaignsPage />} />
              <Route path="/comercial/performance" element={<PerformanceDashboardPage />} />
              <Route path="/comercial/ia" element={<AICommercialDashboardPage />} />
              <Route path="/comercial/execucao" element={<SalesExecutionPage />} />
              <Route path="/comercial/playbook" element={<PlaybookPage />} />
              <Route path="/comercial/gamificacao" element={<GamificationPage />} />
              <Route path="/comercial/automacao" element={<SalesAutomationPage />} />
              
              {/* Financial Module */}
              <Route path="/financeiro/dashboard" element={<FinancialDashboardPage />} />
              <Route path="/financeiro/pagar" element={<AccountsPayable />} />
              <Route path="/financeiro/receber" element={<AccountsReceivable />} />
              <Route path="/financeiro/fluxo" element={<CashFlow />} />
              <Route path="/financeiro/tesouraria" element={<BankAccountsPage />} />
              <Route path="/financeiro/centros-custo" element={<CostCentersPage />} />
              <Route path="/financeiro/renegociacoes" element={<RenegotiationsPage />} />
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
              <Route path="/fiscal" element={<Navigate to="/fiscal/nfe" replace />} />
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
              <Route path="/producao/etapas" element={<ProductionStepsPage />} />
              <Route path="/producao/fila" element={<ProductionQueuePage />} />
              <Route path="/producao/qualidade" element={<QualityControlPage />} />
              <Route path="/producao/consumo" element={<MaterialConsumptionPage />} />
              <Route path="/producao/apontamentos" element={<TimeEntriesPage />} />
              <Route path="/producao/insumos" element={<SupplyStockPage />} />
              <Route path="/producao/custos" element={<ProductCostsPage />} />
              <Route path="/producao/dashboard-industrial" element={<IndustrialDashboardPage />} />
              <Route path="/producao/terminal" element={<OperatorTerminalPage />} />
              <Route path="/producao/chao-fabrica" element={<ShopFloorDashboardPage />} />
              <Route path="/producao/kanban" element={<ProductionKanbanPage />} />
              <Route path="/producao/fichas-tecnicas" element={<TechnicalSheetsPage />} />
              <Route path="/producao/capacidade" element={<ProductionCapacityPage />} />
              <Route path="/producao/rastreabilidade" element={<ProductionTraceabilityPage />} />
              <Route path="/producao/ia" element={<AIProductionPage />} />
              <Route path="/producao/agendamento" element={<ProductionSchedulePage />} />

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
              <Route path="/wms/conferencia" element={<ConferencePage />} />
              <Route path="/wms/inventario" element={<InventoryPage />} />
              <Route path="/wms/movimentacoes" element={<WMSMovementsPage />} />
              <Route path="/wms/expedicao" element={<ShipmentsPage />} />
              <Route path="/wms/lotes" element={<LotsPage />} />
              <Route path="/wms/ondas" element={<WavesPage />} />
              <Route path="/wms/putaway" element={<PutawayPage />} />
              <Route path="/wms/reabastecimento" element={<ReplenishmentPage />} />
              <Route path="/wms/devolucoes" element={<ReturnsPage />} />
              <Route path="/wms/centros-distribuicao" element={<DistributionCentersPage />} />
              <Route path="/wms/saldos" element={<StockBalancesPage />} />
              <Route path="/wms/docas" element={<DocksPage />} />
              <Route path="/wms/ia" element={<WMSAIPage />} />
              
              {/* RFID Module */}
              <Route path="/rfid/dashboard" element={<RFIDDashboardPage />} />
              <Route path="/rfid/leitores" element={<RFIDReadersPage />} />
              <Route path="/rfid/tags" element={<RFIDTagsPage />} />
              <Route path="/rfid/eventos" element={<RFIDEventsPage />} />
              <Route path="/rfid/integracao" element={<RFIDIntegrationPage />} />
              
              {/* TMS Module */}
              <Route path="/tms/dashboard" element={<TMSDashboardPage />} />
              <Route path="/tms/transportadoras" element={<CarriersPage />} />
              <Route path="/tms/veiculos" element={<VehiclesPage />} />
              <Route path="/tms/rotas" element={<RoutesPage />} />
              <Route path="/tms/comprovantes" element={<DeliveryProofPage />} />
              
              {/* Reports Module */}
              <Route path="/relatorios/vendas" element={<SalesReport />} />
              <Route path="/relatorios/estoque" element={<InventoryReport />} />
              <Route path="/relatorios/financeiro" element={<FinancialReport />} />
              <Route path="/relatorios/producao" element={<ProductionReport />} />

              {/* Administration Module */}
              <Route path="/admin/usuarios" element={<UsersPage />} />
              <Route path="/admin/empresas" element={<CompaniesPage />} />
              <Route path="/admin/parametros" element={<ParametersPage />} />
              <Route path="/admin/super" element={<SuperAdminPage />} />

              {/* Profile & Notifications */}
              <Route path="/perfil" element={<ProfilePage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
              
              {/* Config - Placeholder routes */}
              <Route path="/config/*" element={<PlaceholderPage title="Configurações" />} />
            </Route>
            <Route path="/" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
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
