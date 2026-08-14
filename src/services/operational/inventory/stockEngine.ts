import { EstoqueMatrixRow } from "@/hooks/inventory/useEstoqueMatrix";

export interface ProjectedStockResult {
  physical: number;
  reserved: number;
  inTransitIn: number;
  available: number;
  projected: number;
  dailyDemand: number;
  coverageDays: number;
  status: 'critical' | 'attention' | 'normal' | 'excess';
}

export const stockEngine = {
  calculateProjected(row: any): ProjectedStockResult {
    const physical = Number(row.quantity || 0);
    const reserved = Number(row.reserved_quantity || 0);
    const inTransitIn = Number(row.in_transit_in_quantity || 0);
    const dailyDemand = Number(row.average_daily_sales || 1); // fallback to 1 to avoid div by zero

    const available = physical - reserved;
    const projected = available + inTransitIn;
    const coverageDays = dailyDemand > 0 ? projected / dailyDemand : 999;

    let status: ProjectedStockResult['status'] = 'normal';
    if (coverageDays < 1) status = 'critical';
    else if (coverageDays < 3) status = 'attention';
    else if (coverageDays > 15) status = 'excess';

    return {
      physical,
      reserved,
      inTransitIn,
      available,
      projected,
      dailyDemand,
      coverageDays,
      status
    };
  },

  getABCColor(abc: string): string {
    switch(abc) {
      case 'A': return 'text-red-500';
      case 'B': return 'text-amber-500';
      case 'C': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  }
};
