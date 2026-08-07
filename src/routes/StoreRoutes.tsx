import { lazy } from 'react';
import { Route } from 'react-router-dom';

const StoreCentral = lazy(() => import('@/modules/operational/store/StoreCentral'));

export const StoreRoutes = [
  <Route key="store-central" path="/operacional/loja/central" element={<StoreCentral />} />,
];
