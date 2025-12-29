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

// Financial Module
import AccountsPayable from "./pages/financeiro/AccountsPayable";
import AccountsReceivable from "./pages/financeiro/AccountsReceivable";
import CashFlow from "./pages/financeiro/CashFlow";

// Fiscal Module
import NFePage from "./pages/fiscal/NFe";
import NFCePage from "./pages/fiscal/NFCe";
import FiscalReportsPage from "./pages/fiscal/FiscalReports";

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
            <Route path="/comercial/orcamentos" element={<PlaceholderPage title="Orçamentos" />} />
            
            {/* Financial Module */}
            <Route path="/financeiro/pagar" element={<AccountsPayable />} />
            <Route path="/financeiro/receber" element={<AccountsReceivable />} />
            <Route path="/financeiro/fluxo" element={<CashFlow />} />
            <Route path="/financeiro/conciliacao" element={<PlaceholderPage title="Conciliação Bancária" />} />
            
            {/* Fiscal Module */}
            <Route path="/fiscal/nfe" element={<NFePage />} />
            <Route path="/fiscal/nfce" element={<NFCePage />} />
            <Route path="/fiscal/relatorios" element={<FiscalReportsPage />} />

            {/* ERP Modules - Placeholder routes */}
            <Route path="/estoque/*" element={<PlaceholderPage title="Estoque" />} />
            <Route path="/compras/*" element={<PlaceholderPage title="Compras" />} />
            <Route path="/producao/*" element={<PlaceholderPage title="Produção" />} />
            {/* WMS Modules - Placeholder routes */}
            <Route path="/wms/*" element={<PlaceholderPage title="WMS" />} />
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
