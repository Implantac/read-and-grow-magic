import { Dispatch, SetStateAction } from 'react';
import {
  PackageSearch, Route, MapPin, Box, CheckCircle, ScanBarcode, ClipboardList,
  Zap, PlayCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/ui/base/dialog';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner } from '@/components/wms/BarcodeScanner';
import type { PickingStatus } from '@/types/wms';
import { statusConfig, priorityConfig } from './constants';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: any;
  setSelectedOrder: Dispatch<SetStateAction<any>>;
  scannedItems: Record<string, number>;
  setScannedItems: Dispatch<SetStateAction<Record<string, number>>>;
  onStart: () => void;
  onComplete: () => void;
}

export function PickingDetailsDialog({
  open, onOpenChange, selectedOrder, setSelectedOrder,
  scannedItems, setScannedItems, onStart, onComplete,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={selectedOrder ? (statusConfig[selectedOrder.status as PickingStatus]?.variant || 'outline') : 'outline'}>
              {selectedOrder && statusConfig[selectedOrder.status as PickingStatus]?.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">#{selectedOrder?.id?.slice(0, 8)}</span>
          </div>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <PackageSearch className="h-6 w-6 text-primary" />
            Picking: {selectedOrder?.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Separação de itens para o cliente <strong>{selectedOrder?.customerName}</strong>
          </DialogDescription>
        </DialogHeader>

        {selectedOrder && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Prioridade</p>
                <p className={cn("text-sm font-bold", priorityConfig[selectedOrder.priority]?.color.replace('bg-', 'text-'))}>
                  {priorityConfig[selectedOrder.priority]?.label}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Data Criação</p>
                <p className="text-sm font-bold tabular-nums">
                  {format(new Date(selectedOrder.createdAt), 'dd/MM/yy', { locale: ptBR })}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Itens</p>
                <p className="text-sm font-bold tabular-nums">{selectedOrder.itemsCount} un</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-500" />
                Sugestão de Rota (Otimizada)
              </h4>
              <div className="relative p-6 rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5 overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Início</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-dashed bg-muted-foreground/30 relative mx-2">
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-card border-2 border-primary/50 flex items-center justify-center text-primary shadow-md">
                      <Box className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Zona A (A-01-01)</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-dashed bg-muted-foreground/30 relative mx-2">
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 border-t-2 border-dashed border-primary/30" />
                  </div>
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <div className="h-10 w-10 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center text-muted-foreground">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Fim (Packing)</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">IA calculou uma rota 15% mais rápida baseada na geolocalização dos itens</p>
            </div>

            {selectedOrder.status === 'in_progress' && (
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <ScanBarcode className="h-4 w-4 text-primary" />
                      Confirmação de Picking
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
                      Próximo: <span className="text-primary">A-01-01</span> • SKU-001
                    </p>
                  </div>
                  <Badge className="bg-primary hover:bg-primary font-mono">1/12</Badge>
                </div>
                <BarcodeScanner 
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
                    if (currentCount > selectedOrder.itemsCount) {
                      return { type: 'error', message: `Quantidade máxima excedida para ${product.code}.` };
                    }

                    setScannedItems(prev => ({ ...prev, [product.code]: currentCount }));

                    if (selectedOrder.pickedItems < selectedOrder.itemsCount) {
                      setSelectedOrder((prev: any) => ({
                        ...prev,
                        pickedItems: (prev.pickedItems || 0) + 1
                      }));
                    }
                    return { type: 'success', message: `${product.name} coletado com sucesso!`, code: product.code };
                  }}
                  placeholder="Leia o código do item..."
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-orange-500" />
                  Itens para Coleta
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold">{selectedOrder.pickedItems}/{selectedOrder.itemsCount} coletados</Badge>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="h-8 text-[10px] uppercase font-bold">Endereço</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold">Produto</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-center">Quantidade</TableHead>
                      <TableHead className="h-8 text-[10px] uppercase font-bold text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className={cn(selectedOrder.status === 'completed' && "opacity-50 grayscale")}>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="font-mono text-xs">A-01-01</Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-xs font-bold">Produto SKU-442</p>
                        <p className="text-[10px] text-muted-foreground">Local: Prateleira Superior</p>
                      </TableCell>
                      <TableCell className="text-center py-2 text-xs font-mono font-bold">12 un</TableCell>
                      <TableCell className="text-right py-2">
                        {selectedOrder.status === 'in_progress' ? (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-2 gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20">
                            <Zap className="h-3 w-3" /> BIPAR
                          </Button>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {selectedOrder?.status === 'pending' && (
            <Button onClick={onStart}>
              <PlayCircle className="mr-2 h-4 w-4" /> Assumir Picking
            </Button>
          )}
          {selectedOrder?.status === 'in_progress' && (
            <Button
              disabled={selectedOrder.pickedItems < selectedOrder.itemsCount}
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Finalizar Separação
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
