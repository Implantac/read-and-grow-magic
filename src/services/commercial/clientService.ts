import { BaseService } from '../shared/baseService';

export class ClientService extends BaseService<'clients'> {
  constructor() {
    super('clients');
  }
}

export const clientService = new ClientService();

