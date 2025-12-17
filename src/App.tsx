import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

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
            {/* ERP Modules - Placeholder routes */}
            <Route path="/comercial/*" element={<PlaceholderPage title="Comercial" />} />
            <Route path="/financeiro/*" element={<PlaceholderPage title="Financeiro" />} />
            <Route path="/fiscal/*" element={<PlaceholderPage title="Fiscal" />} />
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
