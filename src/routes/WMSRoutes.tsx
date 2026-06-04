import { lazy } from 'react';
import { Route } from 'react-router-dom';

const WMSDashboardPage = lazy(() => import("../pages/wms/Dashboard"));
const ReceivingPage = lazy(() => import("../pages/wms/Receiving"));
const StoragePage = lazy(() => import("../pages/wms/Storage"));
const PickingPage = lazy(() => import("../pages/wms/Picking"));
const PackingPage = lazy(() => import("../pages/wms/Packing"));
const InventoryPage = lazy(() => import("../pages/wms/Inventory"));
const WMSMovementsPage = lazy(() => import("../pages/wms/Movements"));
const ConferencePage = lazy(() => import("../pages/wms/Conference"));
const ShipmentsPage = lazy(() => import("../pages/wms/Shipments"));
const LotsPage = lazy(() => import("../pages/wms/Lots"));
const WavesPage = lazy(() => import("../pages/wms/Waves"));
const PutawayPage = lazy(() => import("../pages/wms/Putaway"));
const ReplenishmentPage = lazy(() => import("../pages/wms/Replenishment"));
const ReturnsPage = lazy(() => import("../pages/wms/Returns"));
const DistributionCentersPage = lazy(() => import("../pages/wms/DistributionCenters"));
const StockBalancesPage = lazy(() => import("../pages/wms/StockBalances"));
const DocksPage = lazy(() => import("../pages/wms/Docks"));
const WMSAIPage = lazy(() => import("../pages/wms/WMSAI"));

export const WMSRoutes = [
  <Route key="wms-dash" path="/wms/dashboard" element={<WMSDashboardPage />} />,
  <Route key="wms-rec" path="/wms/recebimento" element={<ReceivingPage />} />,
  <Route key="wms-store" path="/wms/armazenagem" element={<StoragePage />} />,
  <Route key="wms-pick" path="/wms/separacao" element={<PickingPage />} />,
  <Route key="wms-pack" path="/wms/embalagem" element={<PackingPage />} />,
  <Route key="wms-inv" path="/wms/inventario" element={<InventoryPage />} />,
  <Route key="wms-mov" path="/wms/movimentacoes" element={<WMSMovementsPage />} />,
  <Route key="wms-conf" path="/wms/conferencia" element={<ConferencePage />} />,
  <Route key="wms-ship" path="/wms/expedicao" element={<ShipmentsPage />} />,
  <Route key="wms-lots" path="/wms/lotes" element={<LotsPage />} />,
  <Route key="wms-waves" path="/wms/ondas" element={<WavesPage />} />,
  <Route key="wms-put" path="/wms/putaway" element={<PutawayPage />} />,
  <Route key="wms-rep" path="/wms/ressuprimento" element={<ReplenishmentPage />} />,
  <Route key="wms-ret" path="/wms/devolucoes" element={<ReturnsPage />} />,
  <Route key="wms-dc" path="/wms/centros-distribuicao" element={<DistributionCentersPage />} />,
  <Route key="wms-bal" path="/wms/saldos" element={<StockBalancesPage />} />,
  <Route key="wms-docks" path="/wms/docas" element={<DocksPage />} />,
  <Route key="wms-ai" path="/wms/ia" element={<WMSAIPage />} />,
];
