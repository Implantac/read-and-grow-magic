// Service Locator Pattern for future-proofing and easier mocking/testing
import { clientService } from '@/services/commercial/clientService';
import { financialService } from '@/services/financial/financialService';
import { orderService } from '@/services/commercial/orderService';

export const services = {
  clients: clientService,
  financial: financialService,
  orders: orderService,
};
