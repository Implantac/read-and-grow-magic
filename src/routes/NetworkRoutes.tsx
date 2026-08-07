import { Routes, Route } from 'react-router-dom';
import PosTerminals from '@/modules/operational/network/PosTerminals';
import StockTransfers from '@/modules/operational/network/StockTransfers';
import ReplenishmentIntelligence from '@/modules/operational/network/ReplenishmentIntelligence';
import NetworkControlTower from '@/modules/operational/network/components/NetworkControlTower';

export function NetworkRoutes() {
  return (
    <Routes>
      <Route path="control-tower" element={<NetworkControlTower />} />
      <Route path="pos" element={<PosTerminals />} />
      <Route path="transfers" element={<StockTransfers />} />
      <Route path="replenishment" element={<ReplenishmentIntelligence />} />
    </Routes>
  );
}
