import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, context } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'suggest_message': {
        systemPrompt = `Você é um consultor comercial B2B especialista. Gere mensagens de WhatsApp profissionais, curtas e persuasivas em português brasileiro.
Regras: máximo 3 parágrafos, tom consultivo, inclua CTA claro, adapte ao contexto do cliente.`;
        userPrompt = `Contexto do cliente:
- Nome: ${context.clientName}
- Segmento: ${context.segment || 'Não informado'}
- Última compra: ${context.lastPurchase || 'Sem registro'}
- Valor médio: R$ ${context.avgTicket || '0'}
- Score: ${context.score || 'N/A'}
- Situação: ${context.situation || 'follow-up'}
- Objetivo: ${context.objective || 'reengajar cliente'}

Gere uma mensagem de WhatsApp para ${context.situation || 'follow-up'}.`;
        break;
      }

      case 'suggest_objection_response': {
        systemPrompt = `Você é um especialista em vendas B2B. Sugira respostas para objeções de clientes de forma empática e persuasiva em português brasileiro. Máximo 2 parágrafos.`;
        userPrompt = `Objeção do cliente: "${context.objection}"
Produto/serviço: ${context.product || 'ERP integrado'}
Contexto: ${context.additionalContext || 'Nenhum contexto adicional'}

Sugira uma resposta profissional para essa objeção.`;
        break;
      }

      case 'suggest_follow_up_plan': {
        systemPrompt = `Você é um estrategista comercial B2B. Crie planos de follow-up com datas e ações específicas em português brasileiro. Retorne em formato JSON.`;
        userPrompt = `Cliente: ${context.clientName}
Score: ${context.score || 'N/A'}
Última interação: ${context.lastInteraction || 'Desconhecida'}
Valor do pipeline: R$ ${context.pipelineValue || '0'}
Etapa do funil: ${context.funnelStage || 'lead'}

Crie um plano de follow-up com 3-5 ações sequenciais. Retorne JSON com array "actions" contendo objetos com: day (número de dias a partir de hoje), action_type (call/whatsapp/email/visit), title, message_suggestion.`;
        break;
      }

      case 'generate_daily_plan': {
        systemPrompt = `Você é um diretor comercial B2B experiente. Analise o contexto da carteira de clientes e gere um plano de ação diário priorizado. Responda em JSON válido.`;
        userPrompt = `Dados da carteira:
- Total de leads ativos: ${context.activeLeads || 0}
- Leads quentes (score > 80): ${context.hotLeads || 0}
- Propostas pendentes: ${context.pendingProposals || 0}
- Clientes em risco de churn: ${context.riskClients || 0}
- Clientes inativos (+90d): ${context.dormantClients || 0}
- Follow-ups atrasados: ${context.overdueFollowUps || 0}
- Follow-ups para hoje: ${context.todayFollowUps || 0}
- Valor total do pipeline: R$ ${context.pipelineValue || '0'}
- Clientes prioritários: ${JSON.stringify(context.topClients || [])}

Gere um plano de ação diário em JSON com:
{
  "summary": "resumo executivo de 1-2 frases",
  "priority_actions": [
    {
      "order": 1,
      "action_type": "call|whatsapp|email|visit|proposal",
      "urgency": "critical|high|medium",
      "title": "ação concreta",
      "reason": "por que fazer isso agora",
      "expected_impact": "resultado esperado em R$",
      "suggested_message": "mensagem sugerida se aplicável"
    }
  ],
  "recovery_targets": [
    {
      "client_name": "nome",
      "days_inactive": 0,
      "approach": "abordagem sugerida",
      "message": "mensagem de reativação"
    }
  ],
  "tips": ["dica estratégica 1", "dica 2"]
}

Gere no máximo 8 priority_actions e 5 recovery_targets.`;
        break;
      }

      case 'suggest_reactivation': {
        systemPrompt = `Você é um especialista em recuperação de clientes B2B. Crie mensagens de reativação personalizadas e estratégias de abordagem em português brasileiro.`;
        userPrompt = `Cliente inativo:
- Nome: ${context.clientName}
- Dias sem compra: ${context.daysSinceLastPurchase || '90+'}
- Última compra: R$ ${context.lastPurchaseValue || '0'}
- Ticket médio: R$ ${context.avgTicket || '0'}
- Segmento: ${context.segment || 'Não informado'}
- Classificação ABC: ${context.abcClass || 'N/A'}
- Produtos anteriores: ${context.previousProducts || 'Não informado'}

Gere:
1. Uma mensagem de WhatsApp para reativação (máximo 2 parágrafos)
2. Uma abordagem alternativa por telefone (script curto)
3. Uma oferta especial sugerida para reconquista`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const useJson = ['suggest_follow_up_plan', 'generate_daily_plan'].includes(action);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        ...(useJson ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos em Configurações > Workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error('ai-sales-message error:', e);
    return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
