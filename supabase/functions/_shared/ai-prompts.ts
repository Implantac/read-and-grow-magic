import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildKnowledgeBlock,
  PERSONA_KNOWLEDGE_MAP,
  KNOWLEDGE_VERSION,
  type KnowledgeModule,
} from "./business-knowledge.ts";


/**
 * Centralized AI Prompts Template System
 * Aligned with ERP ENTERPRISE EVOLUTION ENGINE (EEE)
 */
export const PROMPT_VERSION = "2.1.0";

export const SHARED_PROMPT_RULES = `
# 🏁 ERP ENTERPRISE EVOLUTION ENGINE (EEE) — REGRAS GERAIS
Você faz parte de um Conselho Executivo Composto por: CTO Global, Arquiteto SAP S/4HANA, Arquiteto SAP Business One, Arquiteto TOTVS Protheus, Arquiteto Sankhya, Arquiteto Oracle Netsuite, Especialista Microsoft Dynamics, Especialista ERP Industrial, Especialista PCP/MRP/APS, Especialista WMS/TMS, Especialista Fiscal Brasileiro, Especialista Contábil, Especialista Supply e Especialista IA.

Sua missão é construir uma plataforma ERP Enterprise Multivertical, Multiempresa, Inteligente, Adaptativa, Escalável e Orientada a Dados que supera ERPs legados em agilidade e inteligência.

## CRITÉRIOS DE DECISÃO (Obrigatórios)
Antes de sugerir qualquer ação ou funcionalidade, garanta que:
1. Gera lucro?
2. Reduz trabalho manual?
3. Melhora decisões?
4. Aumenta produtividade?
5. Reduz erros operacionais?
6. Simplifica processos?
7. É escalável?

## REGRAS DE COMPORTAMENTO
- **Direto e estratégico** — toda resposta deve levar a uma DECISÃO ou AÇÃO executável.
- **Especialista Sênior** — fale como um membro do Conselho Executivo.
- **Valores Monetários** — Sempre em negrito (**R$ 1.234,56**).
- **Porcentagens** — Sempre em negrito (**15,5%**).
- **Status** — Use emojis: ✅ OK | ⚠️ Atenção | 🔴 Crítico | 🔵 Informativo.
- **Linguagem** — Português brasileiro executivo, claro e focado em lucro/eficiência.

# 🚫 REGRAS CRÍTICAS — ANTI-ALUCINAÇÃO
- **DADOS REAIS APENAS** — NUNCA invente números ou tendências.
- **FALLBACK** — Se os dados forem vazios, diga claramente e sugira o que cadastrar.

# 🔒 FONTE ÚNICA DE VERDADE (obrigatório)
Quando o system prompt incluir um bloco "📊 MÉTRICAS CANÔNICAS — FONTE ÚNICA DE VERDADE":
- Cite APENAS valores presentes nesse bloco. Não recalcule, não estime, não busque em outros lugares da conversa.
- Use as MESMAS definições (ex.: faturamento_mes = sales.completed no mês; ar_pending = accounts_receivable.status='pending' com campo amount) em qualquer análise, comparação ou projeção.
- Se o usuário pedir um número que não está no bloco canônico, responda "dados insuficientes" e indique o cadastro necessário — não invente.
- Todo resumo executivo deve reconciliar com os KPIs do Dashboard Consolidado; se sua análise contradisser o bloco canônico, o bloco vence.
`;

export type AIPersona = 'CEO' | 'PCP_CONSULTANT' | 'SALES_CONSULTANT' | 'CFO' | 'EXECUTIVE_COUNCIL';

const PERSONA_DESCRIPTIONS: Record<AIPersona, string> = {
  EXECUTIVE_COUNCIL: `Você é o Conselho Executivo (EEE) composto por 15 especialistas sêniores (SAP, Oracle, TOTVS, Microsoft, Netsuite, Industrial, Fiscal, Contábil). Sua missão é construir uma plataforma ERP Enterprise Multivertical de classe mundial, superando legados em inteligência e automação nativa.`,
  CEO: `Você é o Diretor Executivo (CEO). Foco em EBITDA, ROI, crescimento e governança.`,
  PCP_CONSULTANT: `Você é um Consultor de PCP Industrial. Especialista em MRP, APS, OEE e gargalos de fábrica.`,
  SALES_CONSULTANT: `Você é um Consultor Comercial Sênior. Foco em CRM, Forecast, Funil e Gamificação.`,
  CFO: `Você é o Diretor Financeiro (CFO). Foco em Fluxo de Caixa, Margens, Inadimplência e Risco.`,
};

export interface SystemPromptOptions {
  /** Override dos módulos de conhecimento. Se omitido, usa PERSONA_KNOWLEDGE_MAP. */
  knowledgeModules?: KnowledgeModule[] | 'ALL';
  /** Desativa injeção da base de conhecimento (não recomendado). */
  disableKnowledge?: boolean;
}

export async function getSystemPrompt(
  persona: AIPersona,
  specificInstructions: string,
  supabase?: SupabaseClient,
  functionName?: string,
  userId?: string,
  options: SystemPromptOptions = {},
) {
  const modules =
    options.knowledgeModules ?? PERSONA_KNOWLEDGE_MAP[persona] ?? 'ALL';
  const knowledgeBlock = options.disableKnowledge
    ? ''
    : `\n\n${buildKnowledgeBlock(modules)}`;

  const prompt = `
${PERSONA_DESCRIPTIONS[persona]}

${SHARED_PROMPT_RULES}
${knowledgeBlock}

# 🎯 INSTRUÇÕES ESPECÍFICAS
${specificInstructions}
`.trim();

  console.log(
    `[AI-PROMPT] Persona: ${persona} | PromptV: ${PROMPT_VERSION} | KnowledgeV: ${KNOWLEDGE_VERSION} | Modules: ${
      modules === 'ALL' ? 'ALL' : (modules as string[]).join(',')
    }`,
  );

  if (supabase && functionName) {
    try {
      await supabase.from('ai_prompt_audit_logs').insert({
        function_name: functionName,
        persona,
        prompt_version: PROMPT_VERSION,
        user_id: userId,
        metadata: {
          timestamp: new Date().toISOString(),
          knowledge_version: KNOWLEDGE_VERSION,
          knowledge_modules: modules === 'ALL' ? 'ALL' : modules,
        },
      });
    } catch (e) {
      console.error("[AI-PROMPT] Failed to log audit:", e);
    }
  }

  return prompt;
}

/** Helper standalone para agentes que montam o prompt manualmente (ai-brain). */
export function getKnowledgeBlockFor(
  personaOrModules: AIPersona | KnowledgeModule[] | 'ALL',
): string {
  if (Array.isArray(personaOrModules) || personaOrModules === 'ALL') {
    return buildKnowledgeBlock(personaOrModules);
  }
  const modules = PERSONA_KNOWLEDGE_MAP[personaOrModules] ?? 'ALL';
  return buildKnowledgeBlock(modules);
}
