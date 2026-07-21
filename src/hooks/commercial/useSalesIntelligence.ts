// ============================================================================
// Sales Intelligence — barrel re-export (AUD-7).
// Módulos individuais em ./salesIntelligence/.
// ============================================================================

export type {
  DbOpportunity,
  DbFollowUp,
  DbCampaign,
  DbDailyTarget,
  ClientInsight,
  ProductSuggestion,
  SalesScript,
  LostSaleAlert,
  RepPerformance,
} from './salesIntelligence/types';

export {
  useOpportunities,
  useCreateOpportunity,
  useUpdateOpportunity,
  useFollowUps,
  useCreateFollowUp,
  useUpdateFollowUp,
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDailyTargets,
} from './salesIntelligence/crud';

export { useClientInsights } from './salesIntelligence/clientInsights';
export { useProductSuggestions } from './salesIntelligence/productSuggestions';
export { useSalesScript } from './salesIntelligence/salesScript';
export { useLostSalesAlerts } from './salesIntelligence/lostSales';
export { useRepPerformance } from './salesIntelligence/repPerformance';
