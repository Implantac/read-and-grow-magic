// Service Locator Pattern for future-proofing and easier mocking/testing
import { clientsService } from '@/services/commercial/clientsService';
import { financialService } from '@/services/financial/financialService';
import { orderService } from '@/services/commercial/orderService';

export const services = {
  clients: clientsService,
  financial: financialService,
  orders: orderService,
};
