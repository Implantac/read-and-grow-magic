import { lazy } from 'react';
import { Route } from 'react-router-dom';

const OperationalDashboardPage = lazy(() => import("../pages/operacional/OperationalDashboard"));
const OrderTrackingPage = lazy(() => import("../pages/operacional/OrderTracking"));
const SeparationQueuePage = lazy(() => import("../pages/operacional/SeparationQueue"));
const ConferenceQueuePage = lazy(() => import("../pages/operacional/ConferenceQueue"));
const BillingQueuePage = lazy(() => import("../pages/operacional/BillingQueue"));
const ShipmentPage = lazy(() => import("../pages/operacional/ShipmentPage"));

export const OperationalRoutes = [
  <Route key="op-dash" path="/operacional/dashboard" element={<OperationalDashboardPage />} />,
  <Route key="op-track" path="/operacional/rastreamento" element={<OrderTrackingPage />} />,
  <Route key="op-sep" path="/operacional/separacao" element={<SeparationQueuePage />} />,
  <Route key="op-conf" path="/operacional/conferencia" element={<ConferenceQueuePage />} />,
  <Route key="op-bill" path="/operacional/faturamento" element={<BillingQueuePage />} />,
  <Route key="op-ship" path="/operacional/expedicao" element={<ShipmentPage />} />,
];
