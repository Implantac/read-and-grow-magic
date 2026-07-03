import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckCircle, User, ShoppingCart, Wallet, Zap } from 'lucide-react';
import { PDVDialog } from '@/components/fiscal/PDVDialog';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Separator } from '@/ui/base/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { toast } from 'sonner';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { formatBRL } from '@/lib/formatters';
import { ClientSelector } from '@/components/commercial/ClientSelector';
import { ClientInstantSummary } from '@/components/commercial/ClientInstantSummary';
import { OrderItemsEditor, type LineItem } from '@/components/commercial/OrderItemsEditor';
import { ProfitabilityCard } from '@/modules/commercial/orders/ProfitabilityCard';
import { useClientCommercialProfile } from '@/hooks/commercial/useClientCommercialProfile';
import { useOrderProfitability } from '@/hooks/commercial/useOrderProfitability';
import { useCreateOrder } from '@/hooks/commercial/useOrders';
import { useO2COrchestrator } from '@/hooks/commercial/useO2COrchestrator';
import { O2CProgressDrawer } from '@/components/commercial/O2CProgressDrawer';
import { NfeRejectionDialog } from '@/components/commercial/NfeRejectionDialog';

const emptyItems: LineItem[] = [];

export default function SalesDeskPage() {
  const [client, setClient] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [items, setItems] = useState<LineItem[]>(emptyItems);
  const [payment, setPayment] = useState('boleto');
  const [condition, setCondition] = useState('30 dias');
  const [freightMode, setFreightMode] = useState<'CIF' | 'FOB'>('FOB');
  const [freight, setFreight] = useState('0');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [delivery, setDelivery] = useState('');

  const [o2cOrderId, setO2cOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectionOpen, setRejectionOpen] = useState(false);
  const [pdvOpen, setPdvOpen] = useState(false);

  const profile = useClientCommercialProfile(client.id);
  const createOrder = useCreateOrder();
  const o2c = useO2COrchestrator(o2cOrderId);

  // Sugerir condição de pagamento e método com base no perfil do cliente
  useEffect(() => {
    if (profile.data?.suggested_payment_terms) {
      setCondition(profile.data.suggested_payment_terms);
      setPayment(profile.data.suggested_payment_terms === 'à vista' ? 'pix' : 'boleto');
    }
  }, [profile.data?.suggested_payment_terms]);

  // Detecta falha SEFAZ e abre o diálogo humanizado
  const sefazFailure = useMemo(
    () => o2c.events.find((e) => e.step === 'sefaz' && e.status === 'failed'),
    [o2c.events]
  );
  useEffect(() => {
    if (sefazFailure) setRejectionOpen(true);
  }, [sefazFailure]);

  const itemsTotal = useMemo(
    () => items.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0),
    [items]
  );
  const freightNum = Number(freight) || 0;
  const orderTotal = itemsTotal + freightNum;

  // Rateio de frete CIF por proporção do item
  const itemsWithFreight = useMemo<LineItem[]>(() => {
    if (freightMode !== 'CIF' || freightNum <= 0 || itemsTotal <= 0) return items;
    return items.map((it) => {
      const share = (it.quantity * it.unit_price - it.discount) / itemsTotal;
      const freightShare = freightNum * share;
      return { ...it, freight_share: freightShare } as LineItem & { freight_share: number };
    });
  }, [items, freightMode, freightNum, itemsTotal]);

  const profitability = useOrderProfitability(itemsWithFreight, freightNum);

  const canSubmit = client.id && items.length > 0 && itemsTotal > 0 && !createOrder.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const created: any = await createOrder.mutateAsync({
        client_id: client.id!,
        client_name: client.name,
        items: items.map((it) => ({
          product_id: it.product_id ?? null,
          product_name: it.product_name,
          product_code: it.product_code,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount,
        })),
        payment_method: payment,
        payment_condition: condition,
        priority: 'medium',
        delivery_date: delivery || null,
        shipping: freightNum,
        notes,
      });
      const newId = created?.id ?? created?.data?.id ?? null;
      toast.success('Pedido criado', { description: 'Pipeline O2C iniciado em background.' });
      setItems([]);
      setNotes('');
      setFreight('0');
      if (newId) {
        setO2cOrderId(newId);
        setDrawerOpen(true);
        // dispara orquestrador no próximo tick (após hook re-render com novo orderId)
        setTimeout(() => o2c.trigger(), 50);
      }
    } catch (err: any) {
      toast.error('Falha ao criar pedido', { description: err.message });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Painel Único de Vendas"
        description="Cliente, itens e pagamento em uma única tela"
        icon={ShoppingCart}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* CARD 1 — Cliente */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              1. Quem está comprando?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ClientSelector
              clientId={client.id}
              clientName={client.name}
              onSelect={setClient}
            />
            <ClientInstantSummary clientId={client.id} orderAmount={orderTotal} />
          </CardContent>
        </Card>

        {/* CARD 2 — Itens */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-primary" />
              2. O que está comprando?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItemsEditor items={items} onChange={setItems} dueDate={delivery || null} />
          </CardContent>
        </Card>

        {/* CARD 3 — Pagamento & Logística */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              3. Como vai pagar e receber?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Forma</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Condição</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="à vista">À vista</SelectItem>
                  <SelectItem value="30 dias">30 dias</SelectItem>
                  <SelectItem value="30/60">30/60 dias</SelectItem>
                  <SelectItem value="30/60/90">30/60/90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Frete</Label>
                <Select value={freightMode} onValueChange={(v) => setFreightMode(v as 'CIF'|'FOB')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOB">FOB (cliente)</SelectItem>
                    <SelectItem value="CIF">CIF (emissor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={freight}
                  onChange={(e) => setFreight(e.target.value)}
                  disabled={freightMode === 'FOB'}
                />
              </div>
            </div>

            {freightMode === 'CIF' && freightNum > 0 && (
              <p className="rounded border border-primary/30 bg-primary/5 p-2 text-xs text-primary">
                Frete será rateado proporcionalmente entre os {items.length} itens para
                compor base de ICMS.
              </p>
            )}

            <div>
              <Label className="text-xs uppercase text-muted-foreground">Transportadora</Label>
              <Input
                placeholder="Nome ou CNPJ"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs uppercase text-muted-foreground">Previsão de entrega</Label>
              <Input type="date" value={delivery} onChange={(e) => setDelivery(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs uppercase text-muted-foreground">Observações</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidade */}
        {items.length > 0 && (
          <div className="lg:col-span-2">
            <ProfitabilityCard data={profitability.data} loading={profitability.isLoading} />
          </div>
        )}

        {/* Rodapé sticky com total + ação */}
        <Card className="lg:col-span-3 sticky bottom-4 border-primary/40 bg-background/95 backdrop-blur">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total do pedido</p>
              <p className="text-2xl font-bold text-primary">{formatBRL(orderTotal)}</p>
              <p className="text-xs text-muted-foreground">
                {items.length} itens · {formatBRL(itemsTotal)} + frete {formatBRL(freightNum)}
              </p>
            </div>
            <Button size="lg" disabled={!canSubmit} onClick={handleSubmit} className="gap-2">
              {createOrder.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle className="h-4 w-4" />}
              Concluir Pedido
            </Button>
          </CardContent>
        </Card>
      </div>

      <O2CProgressDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        orderId={o2cOrderId}
        events={o2c.events}
        stepOrder={o2c.stepOrder}
        running={o2c.running}
        error={o2c.error}
      />

      <NfeRejectionDialog
        open={rejectionOpen}
        onOpenChange={setRejectionOpen}
        rejectionCode={(sefazFailure?.data as any)?.code ?? null}
        rejectionReason={sefazFailure?.message ?? null}
        suggestion={(sefazFailure?.data as any)?.suggestion ?? null}
        onEdit={() => setRejectionOpen(false)}
        onRetry={() => {
          setRejectionOpen(false);
          o2c.trigger();
        }}
      />
    </PageContainer>
  );
}
