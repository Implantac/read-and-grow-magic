import { useCrud } from '../shared/useCrud';
import { clientService } from '@/services/commercial/clientService';
import { DbClient } from '@/hooks/useClients';

export function useClients() {
  const { useList, useCreate, useUpdate, useDelete } = useCrud<DbClient>(
    clientService,
    ['clients'],
    'Cliente'
  );

  return {
    clients: useList(),
    createClient: useCreate(),
    updateClient: useUpdate(),
    deleteClient: useDelete(),
  };
}
