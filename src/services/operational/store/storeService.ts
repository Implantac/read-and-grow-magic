import { supabase } from "@/integrations/supabase/client";

export interface StoreKPIs {
  sales: number;
  ticketAverage: number;
  stockValue: number;
  ruptures: number;
  transfers: number;
  receiving: number;
  openCashiers: number;
}

export interface OperationalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'rupture' | 'receiving' | 'transfer' | 'cashier' | 'replenishment';
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface StoreHealth {
  score: number;
  status: 'excellent' | 'attention' | 'critical';
  factors: {
    label: string;
    score: number;
  }[];
}

export const storeService = {
  async getStoreKPIs(branchId: string): Promise<StoreKPIs> {
    // Busca contagem real de tarefas e rupturas
    const { data: tasks } = await (supabase as any)
      .from('operational_tasks')
      .select('status, category')
      .eq('branch_id', branchId)
      .eq('status', 'pending');

    const ruptures = tasks?.filter((t: any) => t.category === 'rupture').length || 0;
    const transfers = tasks?.filter((t: any) => t.category === 'transfer').length || 0;
    const receiving = tasks?.filter((t: any) => t.category === 'receiving').length || 0;

    return {
      sales: 18430.50, // Ainda mockado até PDV integrar Ledger
      ticketAverage: 87.40,
      stockValue: 242000,
      ruptures,
      transfers,
      receiving,
      openCashiers: 4
    };
  },

  async getOperationalAlerts(branchId: string): Promise<OperationalAlert[]> {
    const { data: tasks, error } = await (supabase as any)
      .from('operational_tasks')
      .select('*')
      .eq('branch_id', branchId)
      .eq('status', 'pending')
      .order('priority', { ascending: false });

    if (error) return [];

    return (tasks || []).map((task: any) => ({
      id: task.id,
      type: task.priority === 'critical' || task.priority === 'high' ? 'critical' : 'warning',
      category: task.category as any,
      title: task.title,
      description: task.description || '',
      actionLabel: 'Tratar',
      actionPath: this.getActionPath(task.category)
    }));
  },

  getActionPath(category: string): string {
    switch(category) {
      case 'rupture': return '/estoque/rupturas';
      case 'receiving': return '/logistica/recebimento';
      case 'transfer': return '/logistica/transferencias';
      case 'cashier': return '/financeiro/caixa';
      case 'inventory': return '/estoque/inventario';
      default: return '/operacional/loja/central';
    }
  },

  async getStoreHealth(branchId: string): Promise<StoreHealth> {
    const reliability = await this.getStockReliability(branchId);
    
    // Lógica de Score: penaliza rupturas e tarefas atrasadas
    const { count: pendingCritical } = await (supabase as any)
      .from('operational_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('status', 'pending')
      .in('priority', ['critical', 'high']);

    const score = Math.max(0, 100 - (pendingCritical || 0) * 5 - (100 - reliability));

    return {
      score: Math.round(score),
      status: score > 90 ? 'excellent' : score > 70 ? 'attention' : 'critical',
      factors: [
        { label: 'Confiabilidade de Estoque', score: Math.round(reliability) },
        { label: 'Gestão de Exceções', score: Math.round(100 - (pendingCritical || 0) * 2) },
        { label: 'Acuracidade de Fluxo', score: 92 },
        { label: 'Vendas vs Meta', score: 88 }
      ]
    };
  },

  async getStockReliability(branchId: string): Promise<number> {
    // Busca divergências recentes para calcular a acuracidade
    const { data: discrepancies } = await (supabase as any)
      .from('operational_discrepancies')
      .select('expected_qty, actual_qty')
      .eq('branch_id', branchId)
      .limit(100);

    if (!discrepancies || discrepancies.length === 0) return 99.2;

    const totalExpected = discrepancies.reduce((acc: number, d: any) => acc + Number(d.expected_qty), 0);
    const totalActual = discrepancies.reduce((acc: number, d: any) => acc + Number(d.actual_qty), 0);
    
    if (totalExpected === 0) return 100;
    
    const accuracy = (1 - Math.abs(totalExpected - totalActual) / totalExpected) * 100;
    return Math.min(100, Math.max(0, accuracy));
  }
};

