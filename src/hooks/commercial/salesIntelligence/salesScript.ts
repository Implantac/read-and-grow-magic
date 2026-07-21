import { useMemo } from 'react';
import type { ClientLike, ClientInsight, SalesScript } from './types';

export function useSalesScript(client: ClientLike | null, insight: ClientInsight | null): SalesScript | null {
  return useMemo(() => {
    if (!client || !insight) return null;

    const isHighValue = insight.avgTicket > 5000;
    const isInactive = insight.daysSinceLastPurchase > 60;
    const isPriceOriented = (client.default_payment_condition || '').includes('prazo');
    const classification = insight.classification || 'C';

    if (isInactive) {
      return {
        approach: '🔄 Reativação — tom amigável e consultivo',
        openingLine: `Olá! Sentimos sua falta. Faz ${insight.daysSinceLastPurchase} dias desde seu último pedido.`,
        keyPoints: [
          'Perguntar o motivo da pausa',
          'Apresentar novidades desde a última compra',
          'Oferecer condição exclusiva de retorno',
        ],
        objectionHandlers: [
          '"Preço alto" → Destacar condições de pagamento flexíveis',
          '"Sem necessidade" → Perguntar sobre estoque e reposição',
          '"Mudou de fornecedor" → Pedir feedback e oferecer teste',
        ],
        closingTechnique: 'Oferecer pedido inicial com desconto especial de reativação.',
      };
    }

    if (classification === 'A' || isHighValue) {
      return {
        approach: '👑 VIP — foco em valor e relacionamento',
        openingLine: `Como um dos nossos clientes mais importantes, tenho uma proposta especial.`,
        keyPoints: [
          'Reforçar parceria de longo prazo',
          'Apresentar lançamentos em primeira mão',
          'Sugerir aumento de mix de produtos',
        ],
        objectionHandlers: [
          '"Já tenho estoque" → Sugerir agendamento futuro com preço travado',
          '"Concorrente ofereceu melhor" → Destacar qualidade e pós-venda',
        ],
        closingTechnique: 'Fechar com exclusividade: "Essa condição é só para nossos parceiros principais."',
      };
    }

    if (isPriceOriented) {
      return {
        approach: '💰 Sensível a preço — focar economia e condições',
        openingLine: `Tenho uma oportunidade de economia que pode interessar.`,
        keyPoints: [
          'Mostrar economia em volume',
          'Destacar condições de pagamento',
          'Comparar custo-benefício',
        ],
        objectionHandlers: [
          '"Muito caro" → Parcelar ou oferecer desconto progressivo',
          '"Vou pensar" → Criar urgência com prazo da oferta',
        ],
        closingTechnique: 'Ancoragem: mostrar preço cheio e depois o desconto especial.',
      };
    }

    return {
      approach: '📋 Padrão — consultivo e focado em necessidades',
      openingLine: `Vim verificar se posso ajudar com alguma necessidade.`,
      keyPoints: [
        'Entender necessidades atuais',
        'Sugerir produtos complementares',
        'Apresentar novidades do catálogo',
      ],
      objectionHandlers: [
        '"Sem orçamento" → Sugerir quantidade menor ou parcelamento',
        '"Preciso de aprovação" → Enviar proposta formal para decisor',
      ],
      closingTechnique: 'Fechar com pergunta direta: "Posso incluir no pedido?"',
    };
  }, [client, insight]);
}
