import { useState } from 'react';

export function useOrchestration() {
  const [isCalculating, setIsCalculating] = useState(false);

  const getBestSourcing = async (items: any[]) => {
    setIsCalculating(true);
    try {
      // Simulação de chamada ao serviço de orquestração
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        recommendation: "DISTRIBUTION_CENTER",
        reason: "Estoque local insuficiente (Ruptura em 2 dias)",
        savings: 15.4
      };
    } finally {
      setIsCalculating(false);
    }
  };

  return { getBestSourcing, isCalculating };
}
