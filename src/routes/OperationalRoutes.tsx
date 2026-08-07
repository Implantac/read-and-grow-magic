import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { StoreRoutes } from './StoreRoutes';

const OperationalDashboardPage = lazy(() => import("../modules/operational/OperationalDashboard"));
const OrderTrackingPage = lazy(() => import("../modules/operational/OrderTracking"));
const SeparationQueuePage = lazy(() => import("../modules/operational/SeparationQueue"));
const ConferenceQueuePage = lazy(() => import("../modules/operational/ConferenceQueue"));
const BillingQueuePage = lazy(() => import("../modules/operational/BillingQueue"));
const ShipmentPage = lazy(() => import("../modules/operational/ShipmentPage"));
const ReplenishmentIntelligencePage = lazy(() => import("../modules/operational/network/ReplenishmentIntelligence"));

export const OperationalRoutes = [
  <Route key="op-dash" path="dashboard" element={<OperationalDashboardPage />} />,
  <Route key="op-track" path="rastreamento" element={<OrderTrackingPage />} />,
  <Route key="op-sep" path="separacao" element={<SeparationQueuePage />} />,
  <Route key="op-conf" path="conferencia" element={<ConferenceQueuePage />} />,
  <Route key="op-bill" path="faturamento" element={<BillingQueuePage />} />,
  <Route key="op-ship" path="expedicao" element={<ShipmentPage />} />,
  <Route key="op-rede-rep" path="rede/ressuprimento" element={<ReplenishmentIntelligencePage />} />,
  ...StoreRoutes,
];
