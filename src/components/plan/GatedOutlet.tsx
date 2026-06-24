import { Outlet } from 'react-router-dom';
import { FeatureGate } from './FeatureGate';

/**
 * Layout-route helper: gates an entire group of child <Route> nodes via plano.
 * Uso:
 * ```tsx
 * <Route element={<GatedOutlet module="wms" />}>
 *   {WMSRoutes}
 * </Route>
 * ```
 */
export function GatedOutlet({ module }: { module: string }) {
  return (
    <FeatureGate module={module}>
      <Outlet />
    </FeatureGate>
  );
}
