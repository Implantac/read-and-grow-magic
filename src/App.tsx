import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Commercial Module
import ClientsPage from "./pages/comercial/Clients";
import SalesPage from "./pages/comercial/Sales";
import OrdersPage from "./pages/comercial/Orders";
import CommercialQuotationsPage from "./pages/comercial/Quotations";

// Financial Module
import AccountsPayable from "./pages/financeiro/AccountsPayable";
import AccountsReceivable from "./pages/financeiro/AccountsReceivable";
import CashFlow from "./pages/financeiro/CashFlow";

// Fiscal Module
import NFePage from "./pages/fiscal/NFe";
import NFCePage from "./pages/fiscal/NFCe";
import FiscalReportsPage from "./pages/fiscal/FiscalReports";

// ERP Inventory Module
import InventoryProductsPage from "./pages/estoque/Products";
import InventoryMovementsPage from "./pages/estoque/Movements";
import KardexPage from "./pages/estoque/Kardex";
import StockLevelsPage from "./pages/estoque/StockLevels";

// WMS Module
import WMSDashboardPage from "./pages/wms/Dashboard";
import ReceivingPage from "./pages/wms/Receiving";
import StoragePage from "./pages/wms/Storage";
import PickingPage from "./pages/wms/Picking";
import PackingPage from "./pages/wms/Packing";
import InventoryPage from "./pages/wms/Inventory";
import WMSMovementsPage from "./pages/wms/Movements";

// Production Module
import ProductionOrdersPage from "./pages/producao/ProductionOrders";
import MaterialConsumptionPage from "./pages/producao/MaterialConsumption";
import TimeEntriesPage from "./pages/producao/TimeEntries";

// Purchasing Module
import SuppliersPage from "./pages/compras/Suppliers";
import PurchaseOrdersPage from "./pages/compras/PurchaseOrders";
import QuotationsPage from "./pages/compras/Quotations";

// Administration Module
import UsersPage from "./pages/admin/Users";
import CompaniesPage from "./pages/admin/Companies";
import ParametersPage from "./pages/admin/Parameters";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Commercial Module */}
            <Route path="/comercial/clientes" element={<ClientsPage />} />
            <Route path="/comercial/vendas" element={<SalesPage />} />
            <Route path="/comercial/pedidos" element={<OrdersPage />} />
            <Route path="/comercial/orcamentos" element={<CommercialQuotationsPage />} />
            
            {/* Financial Module */}
            <Route path="/financeiro/pagar" element={<AccountsPayable />} />
            <Route path="/financeiro/receber" element={<AccountsReceivable />} />
            <Route path="/financeiro/fluxo" element={<CashFlow />} />
            <Route path="/financeiro/conciliacao" element={<PlaceholderPage title="Conciliação Bancária" />} />
            
            {/* Fiscal Module */}
            <Route path="/fiscal/nfe" element={<NFePage />} />
            <Route path="/fiscal/nfce" element={<NFCePage />} />
            <Route path="/fiscal/relatorios" element={<FiscalReportsPage />} />

            {/* Inventory Module */}
            <Route path="/estoque/produtos" element={<InventoryProductsPage />} />
            <Route path="/estoque/movimentacoes" element={<InventoryMovementsPage />} />
            <Route path="/estoque/kardex" element={<KardexPage />} />
            <Route path="/estoque/saldos" element={<StockLevelsPage />} />
            <Route path="/estoque/categorias" element={<PlaceholderPage title="Categorias" />} />
            
            {/* Purchasing Module */}
            <Route path="/compras/fornecedores" element={<SuppliersPage />} />
            <Route path="/compras/pedidos" element={<PurchaseOrdersPage />} />
            <Route path="/compras/cotacoes" element={<QuotationsPage />} />
            
            {/* Production Module */}
            <Route path="/producao/ordens" element={<ProductionOrdersPage />} />
            <Route path="/producao/consumo" element={<MaterialConsumptionPage />} />
            <Route path="/producao/apontamentos" element={<TimeEntriesPage />} />
            
            {/* WMS Module */}
            <Route path="/wms/dashboard" element={<WMSDashboardPage />} />
            <Route path="/wms/recebimento" element={<ReceivingPage />} />
            <Route path="/wms/enderecamento" element={<StoragePage />} />
            <Route path="/wms/picking" element={<PickingPage />} />
            <Route path="/wms/packing" element={<PackingPage />} />
            <Route path="/wms/inventario" element={<InventoryPage />} />
            <Route path="/wms/movimentacoes" element={<WMSMovementsPage />} />
            
            {/* Administration Module */}
            <Route path="/admin/usuarios" element={<UsersPage />} />
            <Route path="/admin/empresas" element={<CompaniesPage />} />
            <Route path="/admin/parametros" element={<ParametersPage />} />
            
            {/* Config - Placeholder routes */}
            <Route path="/config/*" element={<PlaceholderPage title="Configurações" />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Placeholder component for modules not yet implemented
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
