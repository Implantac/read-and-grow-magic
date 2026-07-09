import { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';

const NPSLayout = lazy(() => import('../modules/relacionamento/nps/NPSLayout').then(m => ({ default: m.NPSLayout })));
const NPSDashboard = lazy(() => import('../modules/relacionamento/nps/NPSDashboard'));
const Campaigns = lazy(() => import('../modules/relacionamento/nps/Campaigns'));
const Surveys = lazy(() => import('../modules/relacionamento/nps/Surveys'));
const Invites = lazy(() => import('../modules/relacionamento/nps/Invites'));
const Responses = lazy(() => import('../modules/relacionamento/nps/Responses'));
const Followups = lazy(() => import('../modules/relacionamento/nps/Followups'));
const Reports = lazy(() => import('../modules/relacionamento/nps/Reports'));
const SavedReports = lazy(() => import('../modules/relacionamento/nps/SavedReports'));
const Templates = lazy(() => import('../modules/relacionamento/nps/Templates'));
const Automations = lazy(() => import('../modules/relacionamento/nps/Automations'));
const Logs = lazy(() => import('../modules/relacionamento/nps/Logs'));
const NPSSettings = lazy(() => import('../modules/relacionamento/nps/Settings'));

// CX Center (Ondas 11..17)
const HealthScores = lazy(() => import('../modules/relacionamento/cx/HealthScores'));
const ChurnPrediction = lazy(() => import('../modules/relacionamento/cx/ChurnPrediction'));
const CommentClusters = lazy(() => import('../modules/relacionamento/cx/CommentClusters'));
const ExecutiveSummary = lazy(() => import('../modules/relacionamento/cx/ExecutiveSummary'));
const Workflows = lazy(() => import('../modules/relacionamento/cx/Workflows'));
const SurveyTemplates = lazy(() => import('../modules/relacionamento/cx/SurveyTemplates'));
const CXDashboard = lazy(() => import('../modules/relacionamento/cx/CXDashboard'));

export const RelacionamentoRoutes = [
  <Route key="rel-index" index element={<Navigate to="nps/dashboard" replace />} />,
  <Route key="rel-nps" path="nps" element={<NPSLayout />}>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<NPSDashboard />} />
    <Route path="campanhas" element={<Campaigns />} />
    <Route path="pesquisas" element={<Surveys />} />
    <Route path="convites" element={<Invites />} />
    <Route path="respostas" element={<Responses />} />
    <Route path="followups" element={<Followups />} />
    <Route path="relatorios" element={<Reports />} />
    <Route path="relatorios-salvos" element={<SavedReports />} />
    <Route path="templates" element={<Templates />} />
    <Route path="automacoes" element={<Automations />} />
    <Route path="logs" element={<Logs />} />
    <Route path="configuracoes" element={<NPSSettings />} />
    {/* CX Center */}
    <Route path="health" element={<HealthScores />} />
    <Route path="churn" element={<ChurnPrediction />} />
    <Route path="clusters" element={<CommentClusters />} />
    <Route path="resumo-executivo" element={<ExecutiveSummary />} />
    <Route path="workflows" element={<Workflows />} />
    <Route path="cx-templates" element={<SurveyTemplates />} />
    <Route path="cx-dashboard" element={<CXDashboard />} />
  </Route>,
  // Alias /cx → /relacionamento/nps (Onda 17 - renomeação retrocompatível)
  <Route key="rel-cx-alias" path="cx/*" element={<Navigate to="/relacionamento/nps/dashboard" replace />} />,
];
