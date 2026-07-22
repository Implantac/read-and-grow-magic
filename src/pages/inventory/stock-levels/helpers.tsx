import { AlertCircle, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';
import { stockLevelStatusConfig } from '@/config/inventory';
import type { StockLevelStatus } from '@/types/inventory';

export const getStatusBadge = (status: StockLevelStatus) => {
  const config = stockLevelStatusConfig.find((s) => s.value === status);
  return <Badge className={config?.color}>{config?.label}</Badge>;
};

export const getStatusIcon = (status: StockLevelStatus) => {
  switch (status) {
    case 'critical': return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'low': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'excess': return <TrendingUp className="h-4 w-4 text-blue-600" />;
    default: return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
};

export const getStockPercentage = (current: number, min: number, max: number) => {
  if (max === min) return 100;
  return Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
};

export const getProgressColor = (status: StockLevelStatus) => {
  switch (status) {
    case 'critical': return 'bg-red-600';
    case 'low': return 'bg-amber-500';
    case 'excess': return 'bg-blue-500';
    default: return 'bg-green-500';
  }
};

export const formatCurrency = (value: number) => formatBRL(value);
export const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
export const formatDateBR = (date?: string) =>
  !date ? '-' : format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
