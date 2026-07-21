// ============================================================================
// Fundamentos do sistema — visão de implantador (consultor ERP)
// Ordem cronológica de implantação + regras de negócio por módulo.
// ============================================================================

export interface RoadmapPhase {
  order: number;
  code: string;
  title: string;
  goal: string;
  duration: string;
  owner: string;
  activities: string[];
  deliverable: string;
  gate: string; // critério de saída (go/no-go)
  modules: string[]; // slugs envolvidos
}

/**
 * Roteiro cronológico global de implantação de ERP.
 * Baseado em metodologia UEEF (Diagnóstico → Mapeamento → Desenho →
 * Implementação → Review Loop → Entrega) e boas práticas de mercado
 * (ASAP/Activate, Signature Method, Sure Step).

export interface BusinessRule {
  rule: string;
  reason: string;
  severity: 'blocking' | 'warning' | 'info';
}

export interface DailyRoutine {
  when: string; // "Diariamente 09:00" / "Ao chegar mercadoria" / "Fim do mês"
  action: string;
  responsible: string;
}

export interface ModuleFoundation {
  concept: string; // conceito-chave (2-3 frases fortes)
  businessRules: BusinessRule[];
  keyMetrics: { name: string; formula: string; target: string }[];
  routines: DailyRoutine[];
  integrations: { with: string; what: string }[];
  antipatterns: string[]; // o que NUNCA fazer
}
