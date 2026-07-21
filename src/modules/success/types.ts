export interface SuccessMonthlyRevenue {
  month: string; // YYYY-MM
  label: string; // MMM/YY
  revenue: number;
}

export interface SuccessTopCustomer {
  client_id: string | null;
  client_name: string;
  total: number;
  orders: number;
  last_purchase_days: number | null;
}

export interface SuccessDelinquent {
  client_name: string;
  amount: number;
  days_overdue: number;
  invoice: string;
}

export interface SuccessProductInsight {
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  sold_last_90d: number;
  revenue_last_90d: number;
  margin_pct: number;
  sale_price: number;
  cost_price: number;
  capital_locked: number;
  subcategory?: string;
  last_sale_at: string | null;
  days_since_last_sale: number | null;
  reasons: string[];
}

export interface SuccessSubcategoryStock {
  subcategory: string;
  skus: number;
  stock_qty: number;
  capital_locked: number;
  sold_90d: number;
  turnover_ratio: number;
  stagnation_pct: number;
}

export interface SuccessSupplierSpend {
  supplier_name: string;
  spend_90d: number;
  orders: number;
  share_pct: number;
  potential_savings: number;
}

export interface SuccessCashFlow90d {
  projected_inflow: number;
  projected_outflow: number;
  net: number;
  overdue_ar: number;
  overdue_ap: number;
  inflow_30: number;
  inflow_60: number;
  inflow_90: number;
  outflow_30: number;
  outflow_60: number;
  outflow_90: number;
}

export type HealthPillarKey = "cashflow" | "delinquency" | "margin" | "trend";

export interface HealthPillar {
  key: HealthPillarKey;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  status: "good" | "warn" | "bad";
  metricLabel: string;
  metricValue: string;
  explanation: string;
}

export interface SuccessHealthBreakdown {
  score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  financial: number;
  operational: number;
  commercial: number;
  drivers: string[];
  pillars: HealthPillar[];
}

export interface SuccessAIRecommendation {
  id: string;
  icon: "warning" | "opportunity" | "insight" | "alert";
  title: string;
  detail: string;
  impact?: string;
  priority: number;
}

export interface SuccessData {
  health: SuccessHealthBreakdown;
  revenue12m: SuccessMonthlyRevenue[];
  cashflow: SuccessCashFlow90d;
  slowMoving: SuccessProductInsight[];
  topMargin: SuccessProductInsight[];
  bestSellers: SuccessProductInsight[];
  allProductInsights: SuccessProductInsight[];
  subcategoryStock: SuccessSubcategoryStock[];
  topSuppliers: SuccessSupplierSpend[];
  topCustomers: SuccessTopCustomer[];
  inactiveTopCustomers: SuccessTopCustomer[];
  delinquents: SuccessDelinquent[];
  monthGoal: { goal: number; achieved: number; pct: number };
  recommendations: SuccessAIRecommendation[];
  totals: {
    revenueYTD: number;
    revenueMonth: number;
    revenuePrevMonth: number;
    revenueWeek: number;
    revenuePrevWeek: number;
    activeCustomers: number;
    ordersOpen: number;
    stagnantSkuCount: number;
    stagnantCapital: number;
  };
}
