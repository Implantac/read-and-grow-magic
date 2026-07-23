import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { ScanBarcode, CheckCircle } from 'lucide-react';
import { BarcodeScanner, ScanFeedback } from '@/components/wms/BarcodeScanner';
import type { ConferenceItem } from '@/hooks/wms/useWMSConference';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isBlind: boolean;
  items: ConferenceItem[];
  onScan: (code: string) => Promise<ScanFeedback>;
  onCheckItem: (itemId: string, qty: number) => void;
}

export function ConferenceDetailDialog({ open, onOpenChange, isBlind, items, onScan, onCheckItem }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            Itens da Conferência {isBlind && <Badge variant="destructive">Cega</Badge>}
          </DialogTitle>
        </DialogHeader>

        <BarcodeScanner onScan={onScan} placeholder="Escaneie o código do produto..." autoFocus />

        <div className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">Progresso da conferência</span>
          <div className="flex gap-3">
            <span className="font-medium">
              {items.filter(i => i.status === 'checked').length}/{items.length} itens
            </span>
            {items.some(i => i.divergence !== 0 && i.status === 'checked') && (
              <Badge variant="destructive">
                {items.filter(i => i.divergence !== 0 && i.status === 'checked').length} divergência(s)
              </Badge>
            )}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Produto</TableHead>
              {!isBlind && <TableHead>Esperado</TableHead>}
              <TableHead>Conferido</TableHead>
              {!isBlind && <TableHead>Divergência</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.productCode}</TableCell>
                <TableCell>{item.productName}</TableCell>
                {!isBlind && <TableCell className="tabular-nums">{item.expectedQty}</TableCell>}
                <TableCell>
                  {item.status === 'pending' ? (
                    <Input
                      type="number"
                      className="w-20"
                      placeholder="Qtd"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onCheckItem(item.id, Number((e.target as HTMLInputElement).value));
                      }}
                    />
                  ) : <span className="tabular-nums">{item.checkedQty}</span>}
                </TableCell>
                {!isBlind && (
                  <TableCell>
                    {item.status === 'checked' && (
                      <span className={item.divergence !== 0 ? 'text-destructive font-bold' : 'text-green-600'}>
                        {item.divergence > 0 ? '+' : ''}{item.divergence}
                      </span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={item.status === 'checked' ? (item.divergence !== 0 ? 'destructive' : 'outline') : 'secondary'}>
                    {item.status === 'checked' ? (item.divergence !== 0 ? 'Divergente' : 'OK') : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => onCheckItem(item.id, item.expectedQty)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> OK
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
