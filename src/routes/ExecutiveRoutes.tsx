import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ExecutiveDashboard = lazy(() => import("../pages/diretoria/ExecutiveDashboard"));
const Brain = lazy(() => import("../pages/diretoria/Brain"));
const BrainCommandCenter = lazy(() => import("../pages/diretoria/BrainCommandCenter"));
const BrainLearning = lazy(() => import("../pages/diretoria/BrainLearning"));

export const ExecutiveRoutes = [
  <Route key="exec-dash" path="/diretoria/executive" element={<ExecutiveDashboard />} />,
  <Route key="exec-brain" path="/diretoria/brain" element={<Brain />} />,
  <Route key="exec-brain-cmd" path="/diretoria/brain/comando" element={<BrainCommandCenter />} />,
  <Route key="exec-brain-learn" path="/diretoria/brain/aprendizado" element={<BrainLearning />} />,
];
