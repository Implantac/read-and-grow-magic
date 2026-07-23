import { GitBranch, Route, Package, Clock } from 'lucide-react';
import type { ProductionRouteRow } from '@/hooks/production/useProductionRoutes';

export const emptyRoute: Partial<ProductionRouteRow> = { code: '', product_id: null, product_code: '', product_name: '', version: '1.0', description: '', is_active: true };

export const kpiConfig = [
  { label: 'Total Rotas', icon: GitBranch, color: 'text-primary', ring: 'ring-primary/20' },
  { label: 'Ativas', icon: Route, color: 'text-success', ring: 'ring-success/20' },
  { label: 'Produtos Vinc.', icon: Package, color: 'text-info', ring: 'ring-info/20' },
  { label: 'Tempo Médio', icon: Clock, color: 'text-warning', ring: 'ring-warning/20' },
];
