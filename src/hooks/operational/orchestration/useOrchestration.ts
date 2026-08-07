import { useQuery, useMutation } from '@tanstack/react-query';
import { orchestrationService, SourcingOption } from '@/services/operational/orchestration/orchestrationService';
import { toast } from 'sonner';

export function useSourcingOptions(productId?: string, quantity: number = 1, targetBranchId?: string) {
  return useQuery({
    queryKey: ['sourcing_options', productId, quantity, targetBranchId],
    queryFn: () => orchestrationService.getSourcingOptions(productId!, quantity, targetBranchId!),
    enabled: !!productId && !!targetBranchId
  });
}

export function useOrchestratedOrder() {
  return useMutation({
    mutationFn: ({ orderData, sourcing }: { orderData: any; sourcing: SourcingOption }) => 
      orchestrationService.createOrchestratedOrder(orderData, sourcing),
    onSuccess: () => {
      toast.success('Pedido orquestrado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro na orquestração: ' + error.message);
    }
  });
}
