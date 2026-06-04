import { lazy } from 'react';
import { Route } from 'react-router-dom';

const UsersPage = lazy(() => import("../pages/admin/Users"));
const CompaniesPage = lazy(() => import("../pages/admin/Companies"));
const ParametersPage = lazy(() => import("../pages/admin/Parameters"));
const SuperAdminPage = lazy(() => import("../pages/admin/SuperAdmin"));
const DailyReportsPage = lazy(() => import("../pages/admin/DailyReports"));
const CrossModuleAuditPage = lazy(() => import("../pages/admin/CrossModuleAudit"));

export const AdminRoutes = [
  <Route key="adm-users" path="/admin/usuarios" element={<UsersPage />} />,
  <Route key="adm-comp" path="/admin/empresas" element={<CompaniesPage />} />,
  <Route key="adm-param" path="/admin/parametros" element={<ParametersPage />} />,
  <Route key="adm-super" path="/admin/super" element={<SuperAdminPage />} />,
  <Route key="adm-rep" path="/admin/relatorios" element={<DailyReportsPage />} />,
  <Route key="adm-audit" path="/admin/auditoria" element={<CrossModuleAuditPage />} />,
];
