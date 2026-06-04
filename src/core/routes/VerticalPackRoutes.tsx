import { lazy } from 'react';
import { Route } from 'react-router-dom';

const TextileDashboard = lazy(() => import("@/modules/production/TextileDashboard"));
const PharmaDashboard = lazy(() => import("@/modules/production/PharmaDashboard"));
const RetailDashboard = lazy(() => import("@/modules/production/RetailDashboard"));
const DistributionDashboard = lazy(() => import("@/modules/production/DistributionDashboard"));
const FoodFeedDashboard = lazy(() => import("@/modules/production/FoodFeedDashboard"));

export const VerticalPackRoutes = [
  <Route key="textile-dashboard" path="/vertical/textile" element={<TextileDashboard />} />,
  <Route key="pharma-dashboard" path="/vertical/pharma" element={<PharmaDashboard />} />,
  <Route key="retail-dashboard" path="/vertical/retail" element={<RetailDashboard />} />,
  <Route key="distribution-dashboard" path="/vertical/distribution" element={<DistributionDashboard />} />,
  <Route key="food-feed-dashboard" path="/vertical/food-feed" element={<FoodFeedDashboard />} />,
];
