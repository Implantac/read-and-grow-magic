export interface ExecutiveKPIs {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  grossMargin: number;
  overdueReceivable: number;
  overduePayable: number;
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  activeClients: number;
  lowStockProducts: number;
  defaultRate: number;
  concentrationPct: number;
  avgTicket: number;
  revenueGrowth: number;
  moMGrowth: number;
  yoYGrowth: number;
  clientsAtRisk: number;
  cashFlowProjection30d: number;
  futureReceivables: number;
  futurePayables: number;
  currentRatio: number;
  quickRatio: number;
  prodEfficiency: number;
  prodInProgress: number;
  prodPlanned: number;
  prodCompleted: number;
  targetAttainment: number;
  totalTarget: number;
  totalAchieved: number;
}

export interface ExecutiveInsight {
  id: string;
  insight_type: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  explanation: string;
  data_points: any;
  impact_estimate: string;
  recommended_actions: string[];
  module: string;
  status: string;
  created_at: string;
}

export interface ExecutiveAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  module: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  trend: string;
  status: string;
  created_at: string;
}

export interface SalesRepStat {
  id: string;
  name: string;
  orders: number;
  revenue: number;
}

export interface ExecutiveDashboardData {
  kpis: ExecutiveKPIs;
  revenueByMonth: { month: string; revenue: number }[];
  growthTrends: { month: string; revenueMoM: number; revenueYoY: number; margin: number }[];
  topClients: { name: string; revenue: number }[];
  expenseByCategory: Record<string, number>;
  salesRepStats: SalesRepStat[];
  funnelByStage: Record<string, { count: number; value: number }>;
  insights: ExecutiveInsight[];
  consensus: Array<{ specialist: string; insight: string; status: string }>;
  alerts: ExecutiveAlert[];
  scenarios: any[];
  summary: { totalOrders: number; totalProducts: number; totalClients: number; productionOrders: number; funnelOpportunities: number };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
