import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Label } from '@/ui/base/label';
import { Separator } from '@/ui/base/separator';
import { formatBRL } from '@/lib/formatters';
import type { NFeItemForm } from './types';

interface Props {
  naturezaOp: string;
  clientName: string;
  clientDocument: string;
  items: NFeItemForm[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  totalIcms: number;
  totalIpi: number;
  totalPis: number;
  totalCofins: number;
}

export function StepReview({ naturezaOp, clientName, clientDocument, items, subtotal, discount, shipping, total, totalIcms, totalIpi, totalPis, totalCofins }: Props) {
  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4 animate-bounce" />
        <h3 className="text-2xl font-bold">Tudo pronto!</h3>
        <p className="text-muted-foreground">Revise os valores finais antes de autorizar na SEFAZ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader className="bg-muted/50 border-b py-3 px-6">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">Resumo da Nota</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase">Natureza da Operação</Label>
                <p className="font-bold">{naturezaOp}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase">Destinatário</Label>
                <p className="font-bold">{clientName}</p>
                <p className="text-xs opacity-70">{clientDocument}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label className="text-[10px] text-muted-foreground uppercase">Itens da Nota ({items.length})</Label>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{it.quantity}x {it.productName}</span>
                    <span className="font-mono">{formatBRL(it.quantity * it.unitPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary bg-primary/5 shadow-2xl overflow-hidden">
            <div className="bg-primary px-4 py-2 text-primary-foreground text-[10px] font-bold uppercase text-center tracking-[0.2em]">Total do Documento</div>
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-black tabular-nums text-primary mb-1">{formatBRL(total)}</div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Valor Líquido da Nota</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Itens</span>
                <span className="font-bold">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span className="text-muted-foreground">Descontos</span>
                <span className="font-bold">-{formatBRL(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-bold">+{formatBRL(shipping)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-success">
                <span className="font-bold">Total de Tributos</span>
                <span className="font-bold">{formatBRL(totalIcms + totalIpi + totalPis + totalCofins)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
