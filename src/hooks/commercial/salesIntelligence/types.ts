// ─── DB types ────────────────────────────────────────────────────────────
export interface DbOpportunity {
  id: string;
  client_id: string;
  sales_rep_id: string | null;
  opportunity_type: string;
  title: string;
  description: string | null;
  priority: string;
  suggested_products: unknown;
  estimated_value: number;
  status: string;
  contacted_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFollowUp {
  id: string;
  client_id: string;
  sales_rep_id: string | null;
  funnel_id: string | null;
  order_id: string | null;
  type: string;
  subject: string;
  description: string | null;
  scheduled_date: string;
  completed_at: string | null;
  status: string;
  result: string | null;
  next_action: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCampaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: string;
  target_products: unknown;
  target_segments: unknown;
  goal_type: string;
  goal_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  incentive_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbDailyTarget {
  id: string;
  sales_rep_id: string;
  target_date: string;
  daily_target: number;
  achieved_value: number;
  orders_count: number;
  contacts_made: number;
  opportunities_converted: number;
  created_at: string;
  updated_at: string;
}

// ─── Structural input shapes for consumer hooks (duck-typed) ─────────────
export interface ClientLike {
  id: string; name: string; code: string; segment?: string | null;
  status?: string; last_purchase_date?: string | null;
  purchase_frequency?: number; estimated_potential?: number;
  abc_classification?: string | null; client_score?: string | null;
  sales_rep_id?: string | null; default_payment_condition?: string | null;
}
export interface OrderLike {
  id: string; number?: string; client_id?: string; client_name?: string;
  sales_rep_id?: string | null; date: string; total: number; status: string;
  items?: Array<{ product_id?: string }>;
}
export interface SaleLike {
  client_id?: string; date: string; total: number; status: string;
  items?: Array<{ product_id?: string }>;
}
export interface ProductLike {
  id: string; name: string; code: string; status?: string;
  category_id?: string | null; sale_price: number; cost_price: number;
}
export interface FunnelLike {
  id: string; title: string; value: number; status: string;
  sales_rep_id?: string | null; contact_name?: string | null;
  created_at: string; updated_at?: string | null;
}
export interface FollowUpLike {
  id: string; subject: string; status: string; scheduled_date: string;
}
export interface RepLike { id: string; name: string; monthly_target?: number; }

// ─── Derived / computed types ────────────────────────────────────────────
export interface ClientInsight {
  clientId: string;
  clientName: string;
  clientCode: string;
  segment: string | null;
  lastPurchaseDate: string | null;
  daysSinceLastPurchase: number;
  totalPurchases: number;
  avgTicket: number;
  purchaseFrequency: number;
  estimatedPotential: number;
  classification: string | null;
  score: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  opportunityType: string;
  suggestedAction: string;
  salesRepId: string | null;
}

export interface ProductSuggestion {
  productId: string;
  productName: string;
  productCode: string;
  reason: string;
  estimatedValue: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SalesScript {
  approach: string;
  openingLine: string;
  keyPoints: string[];
  objectionHandlers: string[];
  closingTechnique: string;
}

export interface LostSaleAlert {
  type: 'stagnant_funnel' | 'no_followup' | 'expired_quote' | 'cancelled_order';
  title: string;
  description: string;
  estimatedLoss: number;
  referenceId: string;
  daysSince: number;
  clientName: string;
}

export interface RepPerformance {
  repId: string;
  repName: string;
  totalSales: number;
  ordersCount: number;
  avgTicket: number;
  conversionRate: number;
  avgCycleTime: number;
  lostDeals: number;
  wonDeals: number;
  clientsServed: number;
  ranking: number;
  monthlyTarget: number;
  targetPct: number;
}
