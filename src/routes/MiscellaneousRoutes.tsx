import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ProfilePage = lazy(() => import("../pages/Profile"));
const NotificationsPage = lazy(() => import("../pages/Notifications"));
const LandingPage = lazy(() => import("../pages/LandingPage"));
const RFIDDashboardPage = lazy(() => import("../pages/rfid/Dashboard"));
const RFIDReadersPage = lazy(() => import("../pages/rfid/Readers"));
const RFIDTagsPage = lazy(() => import("../pages/rfid/Tags"));
const RFIDEventsPage = lazy(() => import("../pages/rfid/Events"));
const RFIDIntegrationPage = lazy(() => import("../pages/rfid/Integration"));
const TMSDashboardPage = lazy(() => import("../pages/tms/TMSDashboard"));
const CarriersPage = lazy(() => import("../pages/tms/Carriers"));
const VehiclesPage = lazy(() => import("../pages/tms/Vehicles"));
const RoutesPage = lazy(() => import("../pages/tms/Routes"));
const DeliveryProofPage = lazy(() => import("../pages/tms/DeliveryProof"));
const RoutePlannerPage = lazy(() => import("../pages/tms/RoutePlanner"));
const LiveTrackingPage = lazy(() => import("../pages/tms/LiveTracking"));
const RouteManifestPage = lazy(() => import("../pages/tms/RouteManifest"));

export const MiscellaneousRoutes = [
  <Route key="profile" path="/profile" element={<ProfilePage />} />,
  <Route key="notifications" path="/notifications" element={<NotificationsPage />} />,
  <Route key="landing" path="/landing" element={<LandingPage />} />,
  <Route key="rfid-dash" path="/rfid/dashboard" element={<RFIDDashboardPage />} />,
  <Route key="rfid-readers" path="/rfid/leitores" element={<RFIDReadersPage />} />,
  <Route key="rfid-tags" path="/rfid/tags" element={<RFIDTagsPage />} />,
  <Route key="rfid-events" path="/rfid/eventos" element={<RFIDEventsPage />} />,
  <Route key="rfid-int" path="/rfid/integracao" element={<RFIDIntegrationPage />} />,
  <Route key="tms-dash" path="/tms/dashboard" element={<TMSDashboardPage />} />,
  <Route key="tms-car" path="/tms/transportadoras" element={<CarriersPage />} />,
  <Route key="tms-veh" path="/tms/veiculos" element={<VehiclesPage />} />,
  <Route key="tms-routes" path="/tms/rotas" element={<RoutesPage />} />,
  <Route key="tms-proof" path="/tms/comprovantes" element={<DeliveryProofPage />} />,
  <Route key="tms-live" path="/tms/live" element={<LiveTrackingPage />} />,
  <Route key="tms-planner" path="/tms/rotas/:id/planejamento" element={<RoutePlannerPage />} />,
  <Route key="tms-manifest" path="/tms/rotas/:id/manifesto" element={<RouteManifestPage />} />,
];
