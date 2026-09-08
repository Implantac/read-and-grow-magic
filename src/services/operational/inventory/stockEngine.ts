export interface ProjectedStockResult {
  physical: number;
  reserved: number;
  inTransitIn: number;
  available: number;
  projected: number;
  dailyDemand: number;
  coverageDays: number;
  status: 'critical' | 'attention' | 'normal' | 'excess';
  excessQty: number;
  abcClass?: 'A' | 'B' | 'C';
}

const num = (v: any) => Number(v ?? 0) || 0;

export const stockEngine = {
  /**
   * Calcula a posição projetada de um saldo de estoque.
   * Aceita as colunas reais de `stock_balances` (quantity, reserved_qty, in_transit_qty)
   * e mantém compatibilidade com nomes legados.
   *
   * @param row       Linha de saldo
   * @param options   dailyDemand: demanda média diária real (un/dia)
   *                  minStock / maxStock: parâmetros da política de reposição
   */
  calculateProjected(
    row: any,
    options: { dailyDemand?: number; minStock?: number; maxStock?: number } = {},
  ): ProjectedStockResult {
    const physical = num(row?.quantity);
    const reserved = num(row?.reserved_qty ?? row?.reserved_quantity);
    const inTransitIn = num(row?.in_transit_qty ?? row?.in_transit_in_quantity);
    const dailyDemand = num(options.dailyDemand ?? row?.average_daily_sales);

    const available = physical - reserved;
    const projected = available + inTransitIn;

    const minStock = num(options.minStock ?? row?.min_stock);
    const maxStock = num(options.maxStock ?? row?.max_stock) || Infinity;

    const coverageDays = dailyDemand > 0 ? projected / dailyDemand : projected > 0 ? 999 : 0;

    let status: ProjectedStockResult['status'] = 'normal';
    let excessQty = 0;

    if (projected <= 0 || (minStock > 0 && projected < minStock * 0.5) || coverageDays < 1) {
      status = 'critical';
    } else if ((minStock > 0 && projected < minStock) || coverageDays < 3) {
      status = 'attention';
    } else if (projected > maxStock || coverageDays > 30) {
      status = 'excess';
      excessQty = Math.max(0, projected - (maxStock === Infinity ? dailyDemand * 30 : maxStock));
    }

    return {
      physical,
      reserved,
      inTransitIn,
      available,
      projected,
      dailyDemand,
      coverageDays,
      status,
      excessQty,
      abcClass: row?.abc_class || row?.abc_classification,
    };
  },

  getABCColor(abc: string): string {
    switch (abc) {
      case 'A':
        return 'text-destructive';
      case 'B':
        return 'text-warning';
      case 'C':
        return 'text-info';
      default:
        return 'text-muted-foreground';
    }
  },
};
