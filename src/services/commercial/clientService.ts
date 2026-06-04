import { BaseService } from '../shared/baseService';
import { DbClient } from '@/hooks/useClients';

export class ClientService extends BaseService<DbClient> {
  constructor() {
    super('clients');
  }
}

export const clientService = new ClientService();
