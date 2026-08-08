import { useState } from 'react';

import { orchestrationService } from '@/services/operational/network/orchestrationService';
import { useEnterprise } from '@/core/auth/EnterpriseContext';

export function useOrchestration() {
  const { currentCompany } = useEnterprise();
  const [isCalculating, setIsCalculating] = useState(false);

  const getBestSourcing = async (items: any[]) => {
    if (!currentCompany) return null;
    
    setIsCalculating(true);
    try {
      const result = await orchestrationService.calculateSourcing(items, currentCompany.id);
      return result;
    } catch (error) {
      console.error("Erro ao calcular sourcing:", error);
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  return { getBestSourcing, isCalculating };
}
