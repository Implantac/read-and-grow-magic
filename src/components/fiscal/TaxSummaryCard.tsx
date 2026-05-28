import { Card } from '@/components/ui/card';
import { Calculator, Sparkles } from 'lucide-react';

import { formatBRL } from '@/lib/formatters';
interface TaxSummaryCardProps {
  icms: number;
  icmsST?: number;
  difal?: number;
  pis: number;
  cofins: number;
  ipi: number;
  total: number;
  totalTaxes: number;
}

export function TaxSummaryCard({ icms, icmsST = 0, difal = 0, pis, cofins, ipi, total, totalTaxes }: TaxSummaryCardProps) {
  const taxBurden = total > 0 ? (totalTaxes / total) * 100 : 0;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-md bg-primary/10 p-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold">Impostos calculados automaticamente</div>
          <div className="text-xs text-muted-foreground">Baseado nas regras fiscais cadastradas</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <TaxItem label="ICMS" value={icms} />
        {icmsST > 0 && <TaxItem label="ICMS ST" value={icmsST} highlight />}
        {difal > 0 && <TaxItem label="DIFAL" value={difal} highlight />}
        <TaxItem label="PIS" value={pis} />
        <TaxItem label="COFINS" value={cofins} />
        {ipi > 0 && <TaxItem label="IPI" value={ipi} />}
      </div>

      <div className="border-t pt-3 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            Total de impostos
          </span>
          <span className="font-semibold">{formatBRL(totalTaxes)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Carga tributária</span>
          <span className="font-medium">{taxBurden.toFixed(2)}%</span>
        </div>
      </div>
    </Card>
  );
}

function TaxItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-2 ${highlight ? 'border-warning/30 bg-warning/5' : 'bg-card'}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{formatBRL(value)}</div>
    </div>
  );
}
