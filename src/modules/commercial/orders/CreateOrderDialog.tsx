import { AlertTriangle, CheckCircle, Loader2, Package, ShieldAlert, XCircle } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Card, CardContent } from '@/ui/base/card';
import { Separator } from '@/ui/base/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { ClientSelector } from '@/components/commercial/ClientSelector';
import { OrderItemsEditor, type LineItem } from '@/components/commercial/OrderItemsEditor';
import type { CommercialValidation } from '@/hooks/commercial/useCommercialRules';
import { useCreditCheck } from '@/hooks/commercial/useCreditCheck';
import { CreditBadge } from './CreditBadge';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formClient: { id: string | null; name: string };
  setFormClient: (v: { id: string | null; name: string }) => void;
  formItems: LineItem[];
  setFormItems: (v: LineItem[]) => void;
  formPayment: string;
  setFormPayment: (v: string) => void;
  formCondition: string;
  setFormCondition: (v: string) => void;
  formPriority: string;
  setFormPriority: (v: string) => void;
  formDelivery: string;
  setFormDelivery: (v: string) => void;
  formShipping: string;
  setFormShipping: (v: string) => void;
  formNotes: string;
  setFormNotes: (v: string) => void;
  orderValidations: CommercialValidation[];
  isPending: boolean;
  onSubmit: () => void;
}

export function CreateOrderDialog({
  open, onOpenChange,
  formClient, setFormClient, formItems, setFormItems,
  formPayment, setFormPayment, formCondition, setFormCondition,
  formPriority, setFormPriority, formDelivery, setFormDelivery,
  formShipping, setFormShipping, formNotes, setFormNotes,
  orderValidations, isPending, onSubmit,
}: CreateOrderDialogProps) {
  const orderTotal =
    formItems.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0) +
    (Number(formShipping) || 0);
  const credit = useCreditCheck(formClient.id, orderTotal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Novo Pedido de Venda
          </DialogTitle>
          <DialogDescription>Preencha as informações abaixo para registrar um novo pedido.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-5">
            <ClientSelector clientId={formClient.id} clientName={formClient.name} onSelect={setFormClient} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Forma de Pagamento</Label>
                <Select value={formPayment} onValueChange={setFormPayment}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Condição de Pagamento</Label>
                <Select value={formCondition} onValueChange={setFormCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="À vista">À vista</SelectItem>
                    <SelectItem value="30 dias">30 dias</SelectItem>
                    <SelectItem value="30/60 dias">30/60 dias</SelectItem>
                    <SelectItem value="30/60/90 dias">30/60/90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prioridade</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Previsão de Entrega</Label>
                <Input type="date" value={formDelivery} onChange={(e) => setFormDelivery(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Frete (R$)</Label>
                <Input type="number" step="0.01" value={formShipping} onChange={(e) => setFormShipping(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <OrderItemsEditor items={formItems} onChange={setFormItems} />
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            {formClient.id && orderTotal > 0 && (
              <CreditBadge result={credit.data} loading={credit.isLoading} />
            )}

            {orderValidations.length > 0 && (
              <div className="space-y-2">
                {orderValidations.map((v, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                    v.type === 'block' ? 'border-destructive/50 bg-destructive/5 text-destructive' :
                    v.type === 'approval' ? 'border-yellow-500/50 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400' :
                    'border-muted bg-muted/30 text-muted-foreground'
                  }`}>
                    {v.type === 'block' ? <XCircle className="h-4 w-4 mt-0.5 shrink-0" /> :
                     v.type === 'approval' ? <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" /> :
                     <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium text-xs">{v.type === 'block' ? 'BLOQUEIO' : v.type === 'approval' ? 'APROVAÇÃO NECESSÁRIA' : 'AVISO'}</p>
                      <p className="text-xs">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Instruções especiais, observações sobre entrega, etc..."
                rows={5}
              />
            </div>
            {formItems.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo do Pedido</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Itens ({formItems.length})</span>
                      <span>{formatBRL(formItems.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0))}</span>
                    </div>
                    {Number(formShipping) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frete</span>
                        <span>{formatBRL(Number(formShipping))}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatBRL(formItems.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0) + (Number(formShipping) || 0))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Criar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
