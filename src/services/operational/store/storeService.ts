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
    // Simulando busca de dados reais baseado no branch_id
    // Em produção, isso faria queries agregadas no banco
    return {
      sales: 18430.50,
      ticketAverage: 87.40,
      stockValue: 242000,
      ruptures: 6,
      transfers: 3,
      receiving: 2,
      openCashiers: 4
    };
  },

  async getOperationalAlerts(branchId: string): Promise<OperationalAlert[]> {
    return [
      {
        id: '1',
        type: 'critical',
        category: 'rupture',
        title: '6 produtos em risco de ruptura',
        description: 'Venda acelerada detectada para SKUs de alto giro.',
        actionLabel: 'Ver Produtos',
        actionPath: '/estoque/rupturas'
      },
      {
        id: '2',
        type: 'critical',
        category: 'receiving',
        title: '1 divergência de recebimento',
        description: 'Recebimento #TR-124 com falta de 2 unidades do SKU 002.',
        actionLabel: 'Resolver',
        actionPath: '/logistica/recebimento'
      },
      {
        id: '3',
        type: 'warning',
        category: 'transfer',
        title: '2 transferências aguardando conferência',
        description: 'Volumes chegaram há mais de 4 horas.',
        actionLabel: 'Conferir',
        actionPath: '/logistica/transferencias'
      },
      {
        id: '4',
        type: 'warning',
        category: 'cashier',
        title: '1 caixa com diferença',
        description: 'Diferença de R$ 12,50 no PDV 02.',
        actionLabel: 'Ver Detalhes',
        actionPath: '/financeiro/caixa'
      },
      {
        id: '5',
        type: 'info',
        category: 'replenishment',
        title: 'Reabastecimento sugerido',
        description: 'Sugerido para 4 produtos baseado na demanda prevista.',
        actionLabel: 'Analisar',
        actionPath: '/operacional/rede/ressuprimento'
      }
    ];
  },

  async getStoreHealth(branchId: string): Promise<StoreHealth> {
    return {
      score: 91,
      status: 'excellent',
      factors: [
        { label: 'Confiabilidade de Estoque', score: 99 },
        { label: 'Rupturas', score: 85 },
        { label: 'Divergências', score: 92 },
        { label: 'Vendas vs Meta', score: 88 }
      ]
    };
  },

  async getStockReliability(branchId: string): Promise<number> {
    // Percentual de acuracidade baseado em inventários recentes
    return 99.2;
  }
};
