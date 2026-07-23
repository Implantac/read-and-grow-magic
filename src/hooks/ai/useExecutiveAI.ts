// Barrel re-exporting the Executive AI hooks split into `./executive/*`.
export type {
  ExecutiveKPIs,
  ExecutiveInsight,
  ExecutiveAlert,
  SalesRepStat,
  ExecutiveDashboardData,
  ChatMessage,
} from './executive/types';

export {
  useExecutiveDashboard,
  useGenerateInsights,
  useGenerateScenarios,
  useDailySummary,
} from './executive/queries';

export { useUnifiedChat } from './executive/useUnifiedChat';
