import { useQueryClient } from '@tanstack/react-query';
import { salesService } from '@/services/commercial/salesService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';
import { CreateSaleInput } from '@/types/commercial';

export function useSales() {
  return useSupabaseQuery(['sales'], () => salesService.getAll());
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation(
    (input: CreateSaleInput) => salesService.create(input),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
        queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
        toastSuccess(
          'Venda registrada com sucesso!', 
          'Movimentação de estoque e conta a receber geradas automaticamente.'
        );
      },
      onError: (e) => {
        console.error('Error creating sale:', e);
        handleMutationError(e);
      },
    }
  );
}
