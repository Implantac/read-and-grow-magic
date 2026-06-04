import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ClientsPage = lazy(() => import("../modules/commercial/Clients"));
const SalesPage = lazy(() => import("../modules/commercial/Sales"));
const OrdersPage = lazy(() => import("../modules/commercial/Orders"));
const CommercialQuotationsPage = lazy(() => import("../modules/commercial/Quotations"));
const CommercialDashboardPage = lazy(() => import("../modules/commercial/CommercialDashboard"));
const SalesFunnelPage = lazy(() => import("../modules/commercial/SalesFunnel"));
const SalesRepsPage = lazy(() => import("../modules/commercial/SalesReps"));
const CommissionsPage = lazy(() => import("../modules/commercial/Commissions"));
const SalesTargetsPage = lazy(() => import("../modules/commercial/SalesTargets"));
const ForecastPage = lazy(() => import("../modules/commercial/Forecast"));
const SellerDashboardPage = lazy(() => import("../modules/commercial/SellerDashboard"));
const CampaignsPage = lazy(() => import("../modules/commercial/Campaigns"));
const PerformanceDashboardPage = lazy(() => import("../modules/commercial/PerformanceDashboard"));
const AICommercialDashboardPage = lazy(() => import("../modules/commercial/AICommercialDashboard"));
const SalesExecutionPage = lazy(() => import("../modules/commercial/SalesExecution"));
const PlaybookPage = lazy(() => import("../modules/commercial/Playbook"));
const GamificationPage = lazy(() => import("../modules/commercial/Gamification"));
const SalesAutomationPage = lazy(() => import("../modules/commercial/SalesAutomation"));

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
