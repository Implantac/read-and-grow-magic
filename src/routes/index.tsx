import { Route } from 'react-router-dom';
import { lazy } from 'react';

const MaturityAudit = lazy(() => import("../pages/MaturityAudit"));
const SecurityAudit = lazy(() => import("../modules/admin/SecurityAudit"));
const CrossModuleAudit = lazy(() => import("../modules/admin/CrossModuleAudit"));

/**
 * Add an end-to-end test to verify that the Admin menu links to the Privacidade (LGPD) and Auditing pages correctly across all routes.
 */
export const EvolutionAuditRoutes = [
  <Route key="maturity" path="evolucao/maturidade" element={<MaturityAudit />} />,
  <Route key="security-audit" path="evolucao/seguranca" element={<SecurityAudit />} />,
  <Route key="cross-audit" path="evolucao/cruzada" element={<CrossModuleAudit />} />,
];
