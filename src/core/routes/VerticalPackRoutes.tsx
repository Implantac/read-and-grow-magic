import { lazy } from 'react';
import { Route } from 'react-router-dom';

const TextileDashboard = lazy(() => import("@/modules/production/TextileDashboard"));
// Placeholder para outros componentes de vertical packs

export const VerticalPackRoutes = [
  <Route key="textile-dashboard" path="/vertical/textile" element={<TextileDashboard />} />,
];
