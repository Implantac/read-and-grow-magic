import { lazy } from 'react';
import { Route } from 'react-router-dom';

const NetworkControlTower = lazy(() => import('@/modules/operational/network/components/NetworkControlTower'));
const PosTerminals = lazy(() => import('@/modules/operational/network/PosTerminals'));
const StockTransfers = lazy(() => import('@/modules/operational/network/StockTransfers'));
const ReplenishmentIntelligence = lazy(() => import('@/modules/operational/network/ReplenishmentIntelligence'));

export const NetworkRoutes = [
  <Route key="net-control" path="control-tower" element={<NetworkControlTower />} />,
  <Route key="net-pos" path="pos" element={<PosTerminals />} />,
  <Route key="net-transfers" path="transferencias" element={<StockTransfers />} />,
  <Route key="net-ressuprimento" path="ressuprimento" element={<ReplenishmentIntelligence />} />,
];
