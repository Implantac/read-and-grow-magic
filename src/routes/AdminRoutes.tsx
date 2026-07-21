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
const SecurityAuditPage = lazy(() => import("../modules/admin/SecurityAudit"));
const SystemManualPage = lazy(() => import("../modules/admin/systemManual/SystemManual"));
const ModuleManualDetailPage = lazy(() => import("../modules/admin/systemManual/ModuleManualDetail"));
const CriticalAuditLogPage = lazy(() => import("../modules/admin/CriticalAuditLog"));



const adminOnly = (el: JSX.Element) => (
  <RoleGuard roles={["admin", "manager"]}>{el}</RoleGuard>
);

const superOnly = (el: JSX.Element) => (
  <RoleGuard roles={["admin", "system_admin"]}>{el}</RoleGuard>
);

export const AdminRoutes = [
  <Route key="adm-users" path="usuarios" element={adminOnly(<UsersPage />)} />,
  <Route key="adm-comp" path="empresas" element={adminOnly(<CompaniesPage />)} />,
  <Route key="adm-param" path="parametros" element={adminOnly(<ParametersPage />)} />,
  <Route key="adm-super" path="super" element={superOnly(<SuperAdminPage />)} />,
  <Route key="adm-rep" path="relatorios" element={adminOnly(<DailyReportsPage />)} />,
  <Route key="adm-audit" path="auditoria" element={adminOnly(<CrossModuleAuditPage />)} />,
  <Route key="adm-metadata" path="metadata" element={adminOnly(<MetadataConfiguratorPage />)} />,
  <Route key="adm-workflow" path="workflows" element={adminOnly(<WorkflowEnginePage />)} />,
  <Route key="adm-automation" path="automacoes" element={adminOnly(<AutomationEnginePage />)} />,
  <Route key="adm-dashboards" path="dashboards" element={adminOnly(<DashboardEnginePage />)} />,
  <Route key="adm-security-audit" path="seguranca/auditoria" element={adminOnly(<SecurityAuditPage />)} />,
  <Route key="adm-manual" path="manual" element={<SystemManualPage />} />,
  <Route key="adm-manual-detail" path="manual/:slug" element={<ModuleManualDetailPage />} />,
  <Route key="adm-critical-audit" path="auditoria-critica" element={adminOnly(<CriticalAuditLogPage />)} />,
];


