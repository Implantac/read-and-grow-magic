import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { formatBRL } from '@/lib/formatters';
import { TaxSummaryCard } from '../TaxSummaryCard';
import type { NFeItemForm } from './types';

interface Props {
  items: NFeItemForm[];
  totalIcms: number;
  totalIpi: number;
  totalPis: number;
  totalCofins: number;
  total: number;
}

export function StepTaxes({ items, totalIcms, totalIpi, totalPis, totalCofins, total }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 border-b pb-4">
        <Calculator className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-xl font-bold">Apuração de Tributos</h3>
          <p className="text-sm text-muted-foreground">Valores calculados automaticamente com base nas regras fiscais vigentes</p>
        </div>
      </div>

      <div className="w-full">
        <TaxSummaryCard
          icms={totalIcms}
          pis={totalPis}
          cofins={totalCofins}
          ipi={totalIpi}
          total={total}
          totalTaxes={totalIcms + totalIpi + totalPis + totalCofins}
        />
      </div>

      <Card className="bg-muted/30">
        <CardHeader><CardTitle className="text-sm">Detalhamento por Item</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">ICMS</TableHead>
                <TableHead className="text-right">IPI</TableHead>
                <TableHead className="text-right">PIS</TableHead>
                <TableHead className="text-right">COFINS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-medium">{item.productName}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{formatBRL(item.icms || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{formatBRL(item.ipi || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{formatBRL(item.pis || 0)}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{formatBRL(item.cofins || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
