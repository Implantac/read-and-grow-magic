import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { RoleGuard } from '@/components/auth/RoleGuard';

const UsersPage = lazy(() => import("../modules/admin/Users"));
const CompaniesPage = lazy(() => import("../modules/admin/Companies"));
const ParametersPage = lazy(() => import("../modules/admin/Parameters"));
const SuperAdminPage = lazy(() => import("../modules/admin/SuperAdmin"));
const DailyReportsPage = lazy(() => import("../modules/admin/DailyReports"));
const CrossModuleAuditPage = lazy(() => import("../modules/admin/CrossModuleAudit"));
const MetadataConfiguratorPage = lazy(() => import("../modules/admin/MetadataConfigurator"));
const WorkflowEnginePage = lazy(() => import("../modules/admin/WorkflowEngine"));
const AutomationEnginePage = lazy(() => import("../modules/admin/AutomationEngine"));
const DashboardEnginePage = lazy(() => import("../modules/admin/DashboardEngine"));

const adminOnly = (el: JSX.Element) => (
  <RoleGuard roles={["admin", "manager"]}>{el}</RoleGuard>
);

export const AdminRoutes = [
  <Route key="adm-users" path="/admin/usuarios" element={<UsersPage />} />,
  <Route key="adm-comp" path="/admin/empresas" element={<CompaniesPage />} />,
  <Route key="adm-param" path="/admin/parametros" element={<ParametersPage />} />,
  <Route key="adm-super" path="/admin/super" element={<SuperAdminPage />} />,
  <Route key="adm-rep" path="/admin/relatorios" element={<DailyReportsPage />} />,
  <Route key="adm-audit" path="/admin/auditoria" element={<CrossModuleAuditPage />} />,
  <Route key="adm-metadata" path="/admin/metadata" element={adminOnly(<MetadataConfiguratorPage />)} />,
  <Route key="adm-workflow" path="/admin/workflows" element={adminOnly(<WorkflowEnginePage />)} />,
  <Route key="adm-automation" path="/admin/automacoes" element={adminOnly(<AutomationEnginePage />)} />,
  <Route key="adm-dashboards" path="/admin/dashboards" element={adminOnly(<DashboardEnginePage />)} />,
];

