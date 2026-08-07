import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { networkService } from '@/services/operational/network/networkService';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { toast } from 'sonner';

export function usePosTerminals(branchId?: string) {
  const { currentBranch } = useEnterprise();
  const targetId = branchId || currentBranch?.id;

  return useQuery({
    queryKey: ['pos_terminals', targetId],
    queryFn: () => networkService.getPosTerminals(targetId!),
    enabled: !!targetId
  });
}

export function useTransferOrders() {
  const { currentCompany, currentBranch } = useEnterprise();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['stock_transfer_orders', currentCompany?.id, currentBranch?.id],
    queryFn: () => networkService.getTransferOrders({ 
      companyId: currentCompany!.id, 
      branchId: currentBranch?.id 
    }),
    enabled: !!currentCompany?.id
  });

  const createMutation = useMutation({
    mutationFn: (data: { order: any, items: any[] }) => 
      networkService.createTransferOrder(data.order, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_transfer_orders'] });
      toast.success('Transferência solicitada com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar transferência: ' + error.message);
    }
  });

  return { ...query, createTransfer: createMutation.mutateAsync };
}

export function useReplenishmentPolicies() {
  const { currentBranch } = useEnterprise();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['replenishment_policies', currentBranch?.id],
    queryFn: () => networkService.getReplenishmentPolicies(currentBranch!.id),
    enabled: !!currentBranch?.id
  });

  const upsertMutation = useMutation({
    mutationFn: (policy: any) => networkService.upsertReplenishmentPolicy(policy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replenishment_policies'] });
      toast.success('Política atualizada');
    }
  });

  return { ...query, upsertPolicy: upsertMutation.mutateAsync };
}
