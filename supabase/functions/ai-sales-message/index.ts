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

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const useJson = action === 'suggest_follow_up_plan';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
