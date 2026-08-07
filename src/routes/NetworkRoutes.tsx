import { lazy } from 'react';
import { Route } from 'react-router-dom';

const PosTerminalsPage = lazy(() => import("../modules/operational/network/PosTerminals"));
const StockTransfersPage = lazy(() => import("../modules/operational/network/StockTransfers"));
const ReplenishmentIntelligencePage = lazy(() => import("../modules/operational/network/ReplenishmentIntelligence"));

export const NetworkRoutes = [
  <Route key="net-pos" path="/operacional/rede/pdvs" element={<PosTerminalsPage />} />,
  <Route key="net-transfers" path="/operacional/rede/transferencias" element={<StockTransfersPage />} />,
  <Route key="net-replenishment" path="/operacional/rede/reabastecimento" element={<ReplenishmentIntelligencePage />} />,
];
