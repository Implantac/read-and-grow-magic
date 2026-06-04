import { lazy } from 'react';
import { Route } from 'react-router-dom';

const OperationalDashboardPage = lazy(() => import("../modules/operational/OperationalDashboard"));
const OrderTrackingPage = lazy(() => import("../modules/operational/OrderTracking"));
const SeparationQueuePage = lazy(() => import("../modules/operational/SeparationQueue"));
const ConferenceQueuePage = lazy(() => import("../modules/operational/ConferenceQueue"));
const BillingQueuePage = lazy(() => import("../modules/operational/BillingQueue"));
const ShipmentPage = lazy(() => import("../modules/operational/ShipmentPage"));

export const OperationalRoutes = [
  <Route key="op-dash" path="/operacional/dashboard" element={<OperationalDashboardPage />} />,
  <Route key="op-track" path="/operacional/rastreamento" element={<OrderTrackingPage />} />,
  <Route key="op-sep" path="/operacional/separacao" element={<SeparationQueuePage />} />,
  <Route key="op-conf" path="/operacional/conferencia" element={<ConferenceQueuePage />} />,
  <Route key="op-bill" path="/operacional/faturamento" element={<BillingQueuePage />} />,
  <Route key="op-ship" path="/operacional/expedicao" element={<ShipmentPage />} />,
];
