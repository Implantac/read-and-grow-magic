import { BarChart3, TrendingUp } from 'lucide-react';
import { KPICard } from '@/shared/components/KPICard';
import { formatCurrency } from './helpers';

interface Props {
  totalTaxes: number;
  taxBreakdown: { icms: number; ipi: number; pis: number; cofins: number };
}

export function TaxKPIs({ totalTaxes, taxBreakdown }: Props) {
  const pct = (v: number) => (totalTaxes > 0 ? ((v / totalTaxes) * 100).toFixed(1) : '0');
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KPICard title="Total Impostos" value={formatCurrency(totalTaxes)} icon={<TrendingUp className="h-5 w-5" />} accentColor="primary" index={0} />
      <KPICard title="ICMS" value={formatCurrency(taxBreakdown.icms)} description={`${pct(taxBreakdown.icms)}% do total`} icon={<BarChart3 className="h-5 w-5" />} accentColor="warning" index={1} />
      <KPICard title="COFINS" value={formatCurrency(taxBreakdown.cofins)} description={`${pct(taxBreakdown.cofins)}% do total`} icon={<BarChart3 className="h-5 w-5" />} accentColor="info" index={2} />
      <KPICard title="PIS + IPI" value={formatCurrency(taxBreakdown.pis + taxBreakdown.ipi)} description={`${pct(taxBreakdown.pis + taxBreakdown.ipi)}% do total`} icon={<BarChart3 className="h-5 w-5" />} accentColor="success" index={3} />
    </div>
  );
}
