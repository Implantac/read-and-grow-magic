import { lazy } from 'react';
import { Route } from 'react-router-dom';

const CRMDashboardPage = lazy(() => import("../modules/commercial/CRMDashboard"));
const ClientsPage = lazy(() => import("../modules/commercial/Clients"));
const SalesPage = lazy(() => import("../modules/commercial/Sales"));
const OrdersPage = lazy(() => import("../modules/commercial/Orders"));
const OrderTimelinePage = lazy(() => import("../pages/OrderTimeline"));
const CommercialQuotationsPage = lazy(() => import("../modules/commercial/Quotations"));
const CommercialDashboardPage = lazy(() => import("../modules/commercial/CommercialDashboard"));
const SalesFunnelPage = lazy(() => import("../modules/commercial/SalesFunnel"));
const SalesRepsPage = lazy(() => import("../modules/commercial/SalesReps"));
const CommissionsPage = lazy(() => import("../modules/commercial/Commissions"));
const SalesTargetsPage = lazy(() => import("../modules/commercial/SalesTargets"));
const ForecastPage = lazy(() => import("../modules/commercial/Forecast"));
const ForecastMonteCarloPage = lazy(() => import("../modules/commercial/ForecastMonteCarlo"));
const SellerDashboardPage = lazy(() => import("../modules/commercial/SellerDashboard"));
const CampaignsPage = lazy(() => import("../modules/commercial/Campaigns"));
const PerformanceDashboardPage = lazy(() => import("../modules/commercial/PerformanceDashboard"));
const AICommercialDashboardPage = lazy(() => import("../modules/commercial/AICommercialDashboard"));
const SalesExecutionPage = lazy(() => import("../modules/commercial/SalesExecution"));
const PlaybookPage = lazy(() => import("../modules/commercial/Playbook"));
const GamificationPage = lazy(() => import("../modules/commercial/Gamification"));
const SalesAutomationPage = lazy(() => import("../modules/commercial/SalesAutomation"));

export const CommercialRoutes = [
  <Route key="comercial-crm" path="/commercial/crm" element={<CRMDashboardPage />} />,
  <Route key="comercial-dashboard" path="/commercial/dashboard" element={<CommercialDashboardPage />} />,
  <Route key="comercial-clientes" path="/commercial/clientes" element={<ClientsPage />} />,
  <Route key="comercial-vendas" path="/commercial/vendas" element={<SalesPage />} />,
  <Route key="comercial-pedidos" path="/commercial/pedidos" element={<OrdersPage />} />,
  <Route key="comercial-orcamentos" path="/commercial/orcamentos" element={<CommercialQuotationsPage />} />,
  <Route key="comercial-funil" path="/commercial/funil" element={<SalesFunnelPage />} />,
  <Route key="comercial-representantes" path="/commercial/representantes" element={<SalesRepsPage />} />,
  <Route key="comercial-comissoes" path="/commercial/comissoes" element={<CommissionsPage />} />,
  <Route key="comercial-metas" path="/commercial/metas" element={<SalesTargetsPage />} />,
  <Route key="comercial-forecast" path="/commercial/forecast" element={<ForecastPage />} />,
  <Route key="comercial-forecast-mc" path="/commercial/forecast/monte-carlo" element={<ForecastMonteCarloPage />} />,
  <Route key="comercial-vendedor" path="/commercial/vendedor" element={<SellerDashboardPage />} />,
  <Route key="comercial-campanhas" path="/commercial/campanhas" element={<CampaignsPage />} />,
  <Route key="comercial-performance" path="/commercial/performance" element={<PerformanceDashboardPage />} />,
  <Route key="comercial-ia" path="/commercial/ia" element={<AICommercialDashboardPage />} />,
  <Route key="comercial-execucao" path="/commercial/execucao" element={<SalesExecutionPage />} />,
  <Route key="comercial-playbook" path="/commercial/playbook" element={<PlaybookPage />} />,
  <Route key="comercial-gamificacao" path="/commercial/gamificacao" element={<GamificationPage />} />,
  <Route key="comercial-automacao" path="/commercial/automacao" element={<SalesAutomationPage />} />,
];
