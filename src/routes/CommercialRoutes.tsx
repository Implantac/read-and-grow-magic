import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ClientsPage = lazy(() => import("../pages/comercial/Clients"));
const SalesPage = lazy(() => import("../pages/comercial/Sales"));
const OrdersPage = lazy(() => import("../pages/comercial/Orders"));
const CommercialQuotationsPage = lazy(() => import("../pages/comercial/Quotations"));
const CommercialDashboardPage = lazy(() => import("../pages/comercial/CommercialDashboard"));
const SalesFunnelPage = lazy(() => import("../pages/comercial/SalesFunnel"));
const SalesRepsPage = lazy(() => import("../pages/comercial/SalesReps"));
const CommissionsPage = lazy(() => import("../pages/comercial/Commissions"));
const SalesTargetsPage = lazy(() => import("../pages/comercial/SalesTargets"));
const ForecastPage = lazy(() => import("../pages/comercial/Forecast"));
const SellerDashboardPage = lazy(() => import("../pages/comercial/SellerDashboard"));
const CampaignsPage = lazy(() => import("../pages/comercial/Campaigns"));
const PerformanceDashboardPage = lazy(() => import("../pages/comercial/PerformanceDashboard"));
const AICommercialDashboardPage = lazy(() => import("../pages/comercial/AICommercialDashboard"));
const SalesExecutionPage = lazy(() => import("../pages/comercial/SalesExecution"));
const PlaybookPage = lazy(() => import("../pages/comercial/Playbook"));
const GamificationPage = lazy(() => import("../pages/comercial/Gamification"));
const SalesAutomationPage = lazy(() => import("../pages/comercial/SalesAutomation"));

export const CommercialRoutes = [
  <Route key="comercial-dashboard" path="/comercial/dashboard" element={<CommercialDashboardPage />} />,
  <Route key="comercial-clientes" path="/comercial/clientes" element={<ClientsPage />} />,
  <Route key="comercial-vendas" path="/comercial/vendas" element={<SalesPage />} />,
  <Route key="comercial-pedidos" path="/comercial/pedidos" element={<OrdersPage />} />,
  <Route key="comercial-orcamentos" path="/comercial/orcamentos" element={<CommercialQuotationsPage />} />,
  <Route key="comercial-funil" path="/comercial/funil" element={<SalesFunnelPage />} />,
  <Route key="comercial-representantes" path="/comercial/representantes" element={<SalesRepsPage />} />,
  <Route key="comercial-comissoes" path="/comercial/comissoes" element={<CommissionsPage />} />,
  <Route key="comercial-metas" path="/comercial/metas" element={<SalesTargetsPage />} />,
  <Route key="comercial-forecast" path="/comercial/forecast" element={<ForecastPage />} />,
  <Route key="comercial-vendedor" path="/comercial/vendedor" element={<SellerDashboardPage />} />,
  <Route key="comercial-campanhas" path="/comercial/campanhas" element={<CampaignsPage />} />,
  <Route key="comercial-performance" path="/comercial/performance" element={<PerformanceDashboardPage />} />,
  <Route key="comercial-ia" path="/comercial/ia" element={<AICommercialDashboardPage />} />,
  <Route key="comercial-execucao" path="/comercial/execucao" element={<SalesExecutionPage />} />,
  <Route key="comercial-playbook" path="/comercial/playbook" element={<PlaybookPage />} />,
  <Route key="comercial-gamificacao" path="/comercial/gamificacao" element={<GamificationPage />} />,
  <Route key="comercial-automacao" path="/comercial/automacao" element={<SalesAutomationPage />} />,
];
