import { Route } from 'react-router-dom';
import PosTerminals from '@/modules/operational/network/PosTerminals';
import StockTransfers from '@/modules/operational/network/StockTransfers';
import ReplenishmentIntelligence from '@/modules/operational/network/ReplenishmentIntelligence';
import NetworkControlTower from '@/modules/operational/network/components/NetworkControlTower';

export const NetworkRoutes = [
  <Route key="net-tower" path="/operacional/rede/control-tower" element={<NetworkControlTower />} />,
  <Route key="net-pos" path="/operacional/rede/pos" element={<PosTerminals />} />,
  <Route key="net-transfers" path="/operacional/rede/transferencias" element={<StockTransfers />} />,
  <Route key="net-replenishment" path="/operacional/rede/ressuprimento" element={<ReplenishmentIntelligence />} />,
];
