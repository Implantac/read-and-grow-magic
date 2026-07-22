import { Eye } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import type { StockLevel } from '@/types/inventory';
import { getStatusBadge, getStatusIcon, getStockPercentage, getProgressColor, formatNumber, formatCurrency } from './helpers';

interface Props {
  levels: StockLevel[];
  onView: (item: StockLevel) => void;
}

export function StockLevelsTable({ levels, onView }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48">Nível</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead className="text-right">Disponível</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-4">
                  <EmptyState compact title="Nenhum item encontrado" description="Nenhum saldo de estoque corresponde aos filtros atuais." />
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell>{getStatusIcon(level.status)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{level.productCode}</div>
                      <div className="text-xs text-muted-foreground">{level.productName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{level.category}</TableCell>
                  <TableCell>{getStatusBadge(level.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full transition-all ${getProgressColor(level.status)}`} style={{ width: `${getStockPercentage(level.currentStock, 0, level.maxStock)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatNumber(level.minStock)}</span>
                        <span>{formatNumber(level.maxStock)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(level.currentStock)} {level.unit}</TableCell>
                  <TableCell className="text-right text-green-600">{formatNumber(level.availableStock)}</TableCell>
                  <TableCell className="text-right">{level.daysOfStock}</TableCell>
                  <TableCell className="text-right">{formatCurrency(level.totalValue)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onView(level)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
