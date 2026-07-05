import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

const FiscalDashboardPage = lazy(() => import("../modules/fiscal/FiscalDashboard"));
const NFePage = lazy(() => import("../modules/fiscal/NFe"));
const NFCePage = lazy(() => import("../modules/fiscal/NFCe"));
const CTePage = lazy(() => import("../modules/fiscal/CTe"));
const MDFePage = lazy(() => import("../modules/fiscal/MDFe"));
const TaxRulesPage = lazy(() => import("../modules/fiscal/TaxRules"));
const ICMSSTPage = lazy(() => import("../modules/fiscal/ICMSST"));
const DIFALPage = lazy(() => import("../modules/fiscal/DIFAL"));
const SpedFilesPage = lazy(() => import("../modules/fiscal/SpedFiles"));
const FiscalReportsPage = lazy(() => import("../modules/fiscal/FiscalReports"));
const ReinfPage = lazy(() => import("../modules/fiscal/Reinf"));

export const FiscalRoutes = [
  <Route key="fiscal-dash" path="dashboard" element={<FiscalDashboardPage />} />,
  <Route key="fiscal-nfe" path="nfe" element={<NFePage />} />,
  <Route key="fiscal-nfce" path="nfce" element={<NFCePage />} />,
  <Route key="fiscal-cte" path="cte" element={<CTePage />} />,
  <Route key="fiscal-mdfe" path="mdfe" element={<MDFePage />} />,
  <Route key="fiscal-regras" path="regras-fiscais" element={<TaxRulesPage />} />,
  <Route key="fiscal-icms" path="icms-st" element={<ICMSSTPage />} />,
  <Route key="fiscal-difal" path="difal" element={<DIFALPage />} />,
  <Route key="fiscal-sped" path="sped" element={<SpedFilesPage />} />,
  <Route key="fiscal-reinf" path="reinf" element={<ReinfPage />} />,
  <Route key="fiscal-relatorios" path="relatorios" element={<FiscalReportsPage />} />,
];
