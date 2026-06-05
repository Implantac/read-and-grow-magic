import { KPICard } from '@/shared/components/KPICard';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import { DbSale } from '@/types/commercial';

interface Props {
  sales: DbSale[];
}

export function SalesSummary({ sales }: Props) {
  const filteredSales = sales.filter(s => s.status === 'completed');
  const totalSalesValue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const salesCountValue = filteredSales.length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KPICard 
        title="Total de Vendas" 
        value={formatBRL(totalSalesValue)} 
        icon={<DollarSign className="h-5 w-5" />} 
        accentColor="primary" 
        index={0} 
      />
      <KPICard 
        title="Vendas Concluídas" 
        value={salesCountValue} 
        icon={<ShoppingBag className="h-5 w-5" />} 
        accentColor="success" 
        index={1} 
      />
      <KPICard 
        title="Ticket Médio" 
        value={salesCountValue > 0 ? formatBRL(totalSalesValue / salesCountValue) : 'R$ 0,00'} 
        icon={<TrendingUp className="h-5 w-5" />} 
        accentColor="info" 
        index={2} 
      />
    </div>
  );
}
