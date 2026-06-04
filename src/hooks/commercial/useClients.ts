import { useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/commercial/clientsService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';

export interface DbClient {
  id: string;
  code: string;
  name: string;
  trade_name: string | null;
  document: string;
  document_type: string;
  email: string;
  phone: string;
  cellphone: string | null;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip_code: string;
  status: string;
  credit_limit: number;
  current_balance: number;
  segment: string | null;
  sales_rep_id: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  region: string | null;
  micro_region: string | null;
  default_payment_condition: string | null;
  price_table: string | null;
  abc_classification: string | null;
  commercial_notes: string | null;
  last_purchase_date: string | null;
  avg_ticket: number;
  estimated_potential: number;
  total_purchases: number;
  purchase_frequency: number;
  client_score: string;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  return useSupabaseQuery(['clients'], () => clientsService.getAll());
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (client: Omit<DbClient, 'id' | 'created_at' | 'updated_at'>) => clientsService.create(client),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toastSuccess('Cliente cadastrado com sucesso!');
      },
      onError: handleMutationError,
    }
  );
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ id, ...client }: Partial<DbClient> & { id: string }) => clientsService.update(id, client),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toastSuccess('Cliente atualizado com sucesso!');
      },
      onError: handleMutationError,
    }
  );
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (id: string) => clientsService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toastSuccess('Cliente excluído com sucesso!');
      },
      onError: handleMutationError,
    }
  );
}
