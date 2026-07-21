// ============================================================================
// Fundamentos do sistema — tipos compartilhados
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
