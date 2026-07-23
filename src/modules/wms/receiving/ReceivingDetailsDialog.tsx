import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Checkbox } from '@/ui/base/checkbox';
import { Truck, CheckCircle, Clock, PlayCircle, ShieldCheck, AlertCircle, Box, LayoutGrid, ScanBarcode } from 'lucide-react';
import { BarcodeScanner } from '@/components/wms/BarcodeScanner';
import { cn } from '@/lib/utils';
import { statusConfig, formatDate } from './constants';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: any;
  setOrder: (o: any) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
}

export function ReceivingDetailsDialog({ open, onOpenChange, order, setOrder, onStart, onComplete }: Props) {
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
  const [qualityCheck, setQualityCheck] = useState({ damaged: false, qtyMismatch: false, tempChecked: true });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={order ? (statusConfig[order.status]?.variant || 'outline') : 'outline'}>
              {order && statusConfig[order.status]?.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">#{order?.id?.slice(0, 8)}</span>
          </div>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Recebimento: {order?.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Conferência de mercadorias do fornecedor <strong>{order?.supplier}</strong>
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Doca de Descarga</Label>
                <div className="flex items-center gap-2 font-semibold">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  {order.dock || 'Não atribuída'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Previsão de Entrega</Label>
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDate(order.expectedDate)}
                </div>
              </div>
            </div>

            {order.status === 'in_progress' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <ScanBarcode className="h-4 w-4 text-primary" />
                    Conferência por Coletor
                  </h4>
                  <Badge variant="outline" className="text-[10px] animate-pulse bg-primary/5">AGUARDANDO LEITURA</Badge>
                </div>
                <BarcodeScanner
                  autoFocus
                  onScan={async (code) => {
                    const { data: product, error } = await supabase
                      .from('products')
                      .select('id, code, name, status')
                      .or(`barcode.eq.${code},code.eq.${code}`)
                      .maybeSingle();

                    if (error) return { type: 'error', message: 'Erro ao consultar produto.' };
                    if (!product) return { type: 'error', message: `SKU/EAN ${code} não encontrado.` };
                    if (product.status !== 'active') return { type: 'error', message: `Produto ${product.code} está inativo.` };

                    const currentCount = (scannedItems[product.code] || 0) + 1;
                    if (currentCount > order.itemsCount) {
                      return { type: 'error', message: `Quantidade máxima excedida para ${product.code}.` };
                    }

                    setScannedItems(prev => ({ ...prev, [product.code]: currentCount }));

                    if (order.receivedItems < order.itemsCount) {
                      setOrder({ ...order, receivedItems: (order.receivedItems || 0) + 1 });
                    }

                    return { type: 'success', message: `${product.name} (1 un) validado.`, code: product.code };
                  }}
                  placeholder="Escaneie o EAN do produto..."
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-muted/30 border border-muted space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Progresso da Conferência</p>
                  <p className="text-xs text-muted-foreground">{order.receivedItems || 0} de {order.itemsCount || 0} itens conferidos</p>
                </div>
                <span className="text-2xl font-black tabular-nums">
                  {Math.round(((order.receivedItems || 0) / (order.itemsCount || 1)) * 100)}%
                </span>
              </div>
              <Progress value={((order.receivedItems || 0) / (order.itemsCount || 1)) * 100} className="h-3" />
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Checklist de Qualidade (QA)
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors",
                  qualityCheck.damaged ? "bg-destructive/5 border-destructive/20" : "bg-card border-border")}>
                  <div className="flex items-center gap-3">
                    <Checkbox id="damaged" checked={qualityCheck.damaged}
                      onCheckedChange={(v) => setQualityCheck(prev => ({ ...prev, damaged: !!v }))} />
                    <Label htmlFor="damaged" className="cursor-pointer">Existem itens avariados/danificados?</Label>
                  </div>
                  {qualityCheck.damaged && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>

                <div className={cn("flex items-center justify-between p-3 rounded-lg border transition-colors",
                  qualityCheck.qtyMismatch ? "bg-destructive/5 border-destructive/20" : "bg-card border-border")}>
                  <div className="flex items-center gap-3">
                    <Checkbox id="mismatch" checked={qualityCheck.qtyMismatch}
                      onCheckedChange={(v) => setQualityCheck(prev => ({ ...prev, qtyMismatch: !!v }))} />
                    <Label htmlFor="mismatch" className="cursor-pointer">Divergência entre NF e Físico?</Label>
                  </div>
                  {qualityCheck.qtyMismatch && <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Box className="h-4 w-4 text-blue-500" />
                Itens na Ordem
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="h-8 text-[10px] uppercase font-bold">Produto</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-center">Esperado</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-center">Recebido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="py-2">
                        <p className="text-xs font-bold">Produto SKU-001</p>
                        <p className="text-[10px] text-muted-foreground">Caixa com 12 unidades</p>
                      </TableCell>
                      <TableCell className="text-center py-2 text-xs font-mono">{order.itemsCount}</TableCell>
                      <TableCell className="text-center py-2 text-xs font-mono font-bold text-primary">{order.receivedItems}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {order?.status === 'pending' && (
            <Button onClick={() => onStart(order.id)}>
              <PlayCircle className="mr-2 h-4 w-4" /> Iniciar Recebimento
            </Button>
          )}
          {order?.status === 'in_progress' && (
            <Button onClick={() => onComplete(order.id)}
              disabled={order.receivedItems < order.itemsCount}
              className={cn(order.receivedItems < order.itemsCount ? "bg-muted text-muted-foreground" : "bg-green-600 hover:bg-green-700")}>
              <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Recebimento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
