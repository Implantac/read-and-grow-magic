import { useState, useEffect } from 'react';
import { predictiveIntelligenceService, DemandPrediction } from '@/services/ai/PredictiveIntelligenceService';
import { useToast } from '@/ui/base/use-toast';

export function usePredictiveIntelligence(productId: string | null, options: { days?: number, seasonality?: 'none' | 'high' | 'low' } = {}) {
  const [demand, setDemand] = useState<DemandPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDemand = async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const data = await predictiveIntelligenceService.predictProductDemand(productId, options);
      setDemand(data);
    } catch (error) {
      console.error('Error fetching demand prediction:', error);
      toast({
        title: "Erro na IA Preditiva",
        description: "Não foi possível carregar as projeções de demanda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchDemand();
    } else {
      setDemand(null);
    }
  }, [productId, options.days, options.seasonality]);

  return {
    demand,
    loading,
    refetch: fetchDemand
  };
}
