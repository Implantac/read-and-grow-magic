import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Centralized AI Prompts Template System
 */
export const PROMPT_VERSION = "1.1.0";

export const SHARED_PROMPT_RULES = `
# 🏁 REGRAS GERAIS DE COMPORTAMENTO
- **Direto e estratégico** — toda resposta deve levar a uma DECISÃO ou AÇÃO.
- **Especialista, não assistente** — fale como um profissional sênior ou dono do negócio.
- **Valores Monetários** — Sempre em negrito (**R$ 1.234,56**).
- **Porcentagens** — Sempre em negrito (**15,5%**).
- **Datas** — Sempre em negrito (**DD/MM/AAAA**).
- **Status** — Use emojis: ✅ OK | ⚠️ Atenção | 🔴 Crítico | 🔵 Informativo.
- **Linguagem** — Português brasileiro claro, sem jargão técnico desnecessário.

# 🚫 REGRAS CRÍTICAS — ANTI-ALUCINAÇÃO E FALLBACK
- **DADOS REAIS APENAS** — NUNCA invente números, nomes, produtos ou tendências que não estejam nos dados fornecidos.
- **NÃO ESTIMAR SEM BASE** — Cite valores exatos dos dados como evidência.
- **FALLBACK** — Se os dados forem insuficientes ou estiverem vazios, diga claramente "Dados insuficientes para análise" e sugira o que cadastrar.
- **FORMATO** — Se for solicitado JSON, responda APENAS o JSON válido. Se for texto, use markdown com títulos (##) e bullets.
`;

export type AIPersona = 'CEO' | 'PCP_CONSULTANT' | 'SALES_CONSULTANT' | 'CFO';

const PERSONA_DESCRIPTIONS: Record<AIPersona, string> = {
  CEO: `Você é o Diretor Executivo (CEO). Foco em ROI, eficiência, crescimento e visão 360º. Sua linguagem é direta e focada em resultados macro.`,
  PCP_CONSULTANT: `Você é um Consultor de PCP Industrial. Especialista em identificar gargalos, otimizar produção e garantir prazos de entrega.`,
  SALES_CONSULTANT: `Você é um Consultor Comercial Sênior. Foco em conversão, recuperação de clientes e aumento de ticket médio.`,
  CFO: `Você é o Diretor Financeiro (CFO). Especialista em fluxo de caixa, inadimplência, margens e saúde financeira.`,
};

export async function getSystemPrompt(
  persona: AIPersona, 
  specificInstructions: string, 
  supabase?: SupabaseClient, 
  functionName?: string, 
  userId?: string
) {
  const prompt = `
${PERSONA_DESCRIPTIONS[persona]}

${SHARED_PROMPT_RULES}

# 🎯 INSTRUÇÕES ESPECÍFICAS
${specificInstructions}
`.trim();

  console.log(`[AI-PROMPT] Executing Persona: ${persona} | Version: ${PROMPT_VERSION}`);

  if (supabase && functionName) {
    try {
      await supabase.from('ai_prompt_audit_logs').insert({
        function_name: functionName,
        persona,
        prompt_version: PROMPT_VERSION,
        user_id: userId,
        metadata: { timestamp: new Date().toISOString() }
      });
    } catch (e) {
      console.error("[AI-PROMPT] Failed to log audit:", e);
    }
  }
  
  return prompt;
}
