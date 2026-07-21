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

