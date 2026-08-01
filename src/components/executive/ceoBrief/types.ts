/** Tipos do bloco CEO Brief (retorno da IA executiva). */

export interface CEOForecast {
  trend?: string | null;
  previsao_proximo_mes?: number | null;
  ultimo_mes?: number | null;
  media_movel_6m?: number | null;
}

export interface CEORisk {
  titulo?: string | null;
  detalhe?: string | null;
  impacto?: string | null;
}

export interface CEOPlanItem {
  tipo?: string | null;
  titulo?: string | null;
  detalhe?: string | null;
}

export interface CEODecision {
  action?: string | null;
  type?: string | null;
  priority?: string | null;
}

export interface CEOKPI {
  kpi_name: string;
  category: string;
  current_value: number;
  target_value: number;
  status: string;
  trend: string;
  explanation: string;
  snapshot_date: string;
}
