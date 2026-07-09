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
const Templates = lazy(() => import('../modules/relacionamento/nps/Templates'));
const Automations = lazy(() => import('../modules/relacionamento/nps/Automations'));
const Logs = lazy(() => import('../modules/relacionamento/nps/Logs'));
const NPSSettings = lazy(() => import('../modules/relacionamento/nps/Settings'));

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
    <Route path="templates" element={<Templates />} />
    <Route path="automacoes" element={<Automations />} />
    <Route path="logs" element={<Logs />} />
    <Route path="configuracoes" element={<NPSSettings />} />
  </Route>,
];
