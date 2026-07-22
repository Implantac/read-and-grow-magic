import { ShoppingCart } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import type { StockLevel } from '@/types/inventory';
import { getStatusBadge, getStatusIcon, getStockPercentage, getProgressColor, formatNumber, formatCurrency, formatDateBR } from './helpers';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: StockLevel | null;
}

export function StockLevelDetailDialog({ open, onOpenChange, item }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Estoque</DialogTitle>
          <DialogDescription>{item?.productCode} - {item?.productName}</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="grid gap-4">
            <div className="flex items-center gap-2">{getStatusIcon(item.status)}{getStatusBadge(item.status)}</div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Nível de Estoque</span>
                <span>{formatNumber(item.currentStock)} / {formatNumber(item.maxStock)}</span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                <div className={`h-full transition-all ${getProgressColor(item.status)}`} style={{ width: `${getStockPercentage(item.currentStock, 0, item.maxStock)}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-amber-600" style={{ left: `${(item.minStock / item.maxStock) * 100}%` }} />
                <div className="absolute top-0 h-full w-0.5 bg-blue-600" style={{ left: `${(item.reorderPoint / item.maxStock) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mín: {formatNumber(item.minStock)}</span>
                <span>Repos: {formatNumber(item.reorderPoint)}</span>
                <span>Máx: {formatNumber(item.maxStock)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">Estoque Atual</Label><p className="font-medium">{formatNumber(item.currentStock)} {item.unit}</p></div>
              <div><Label className="text-muted-foreground">Reservado</Label><p className="font-medium">{formatNumber(item.reservedStock)} {item.unit}</p></div>
              <div><Label className="text-muted-foreground">Disponível</Label><p className="font-medium text-green-600">{formatNumber(item.availableStock)} {item.unit}</p></div>
              <div><Label className="text-muted-foreground">Dias de Estoque</Label><p className="font-medium">{item.daysOfStock} dias</p></div>
              <div><Label className="text-muted-foreground">Consumo Médio/Dia</Label><p className="font-medium">{formatNumber(item.averageDailyConsumption)} {item.unit}</p></div>
              <div><Label className="text-muted-foreground">Valor em Estoque</Label><p className="font-medium">{formatCurrency(item.totalValue)}</p></div>
              <div><Label className="text-muted-foreground">Última Compra</Label><p className="font-medium">{formatDateBR(item.lastPurchaseDate)}</p></div>
              <div><Label className="text-muted-foreground">Última Venda</Label><p className="font-medium">{formatDateBR(item.lastSaleDate)}</p></div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {item && (item.status === 'critical' || item.status === 'low') && (
            <Button><ShoppingCart className="mr-2 h-4 w-4" />Solicitar Compra</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
