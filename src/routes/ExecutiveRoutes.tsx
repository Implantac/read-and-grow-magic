import { lazy } from 'react';
import { Route } from 'react-router-dom';

const ExecutiveDashboard = lazy(() => import("../pages/executive/ExecutiveDashboard"));
const Brain = lazy(() => import("../pages/executive/Brain"));
const BrainCommandCenter = lazy(() => import("../pages/executive/BrainCommandCenter"));
const BrainLearning = lazy(() => import("../pages/executive/BrainLearning"));

export const ExecutiveRoutes = [
  <Route key="exec-dash" path="/executive/executive" element={<ExecutiveDashboard />} />,
  <Route key="exec-brain" path="/executive/brain" element={<Brain />} />,
  <Route key="exec-brain-cmd" path="/executive/brain/comando" element={<BrainCommandCenter />} />,
  <Route key="exec-brain-learn" path="/executive/brain/aprendizado" element={<BrainLearning />} />,
];
