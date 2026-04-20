import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, FileText, Users, Package, Calculator,
  Truck, CreditCard, ClipboardCheck, ArrowLeft, ArrowRight, Send, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cfopOptions } from '@/config/fiscal';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { calculateItemTaxes } from '@/hooks/useTaxRules';
import { FiscalStepper } from './FiscalStepper';
import { SmartSelect, SmartSelectOption } from './SmartSelect';
import { TaxSummaryCard } from './TaxSummaryCard';

interface NFeItemForm {
  productCode: string;
  productName: string;
  productId?: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  // Cálculo
  icms?: number;
  pis?: number;
  cofins?: number;
  ipi?: number;
}

interface CreateNFeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    clientName: string;
    clientId?: string;
    clientDocument?: string;
    operationType: string;
    items: { productCode: string; productName: string; productId?: string; quantity: number; unitPrice: number; unit?: string; ncm?: string; cfop?: string }[];
    discount?: number;
    shipping?: number;
  }) => Promise<any>;
}

const STEPS = [
  { id: 'info', label: 'Dados', icon: FileText },
  { id: 'client', label: 'Cliente', icon: Users },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'taxes', label: 'Impostos', icon: Calculator },
  { id: 'transport', label: 'Transporte', icon: Truck },
  { id: 'finance', label: 'Financeiro', icon: CreditCard },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function CreateNFeDialog({ open, onOpenChange, onCreate }: CreateNFeDialogProps) {
  const clientsQuery = useClients();
  const productsQuery = useProducts();
  const clients = clientsQuery.data || [];
  const products = productsQuery.data || [];
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Etapa 1 — Dados
  const [operationType, setOperationType] = useState('saida');
  const [naturezaOp, setNaturezaOp] = useState('Venda de mercadoria');
  const [defaultCfop, setDefaultCfop] = useState('5102');

  // Etapa 2 — Cliente
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [clientUF, setClientUF] = useState('');

  // Etapa 3 — Produtos
  const [items, setItems] = useState<NFeItemForm[]>([]);

  // Etapa 5 — Transporte
  const [carrierName, setCarrierName] = useState('');
  const [freightType, setFreightType] = useState('1'); // 0=emit,1=dest,2=tercer,9=sem
  const [shipping, setShipping] = useState(0);
  const [volumeQty, setVolumeQty] = useState(1);

  // Etapa 6 — Financeiro
  const [paymentMethod, setPaymentMethod] = useState('99');
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);

  // Auto-sugestão CFOP por UF
  useEffect(() => {
    if (!clientUF) return;
    // Mesma UF (assumindo emitente SP por padrão) → 5102; outra → 6102
    const sameState = clientUF === 'SP';
    const newCfop = operationType === 'saida' ? (sameState ? '5102' : '6102') : '1102';
    setDefaultCfop(newCfop);
    // Atualiza CFOP dos itens que ainda usavam o anterior
    setItems((prev) => prev.map((i) => ({ ...i, cfop: newCfop })));
  }, [clientUF, operationType]);

  // Cálculo automático de impostos por item
  useEffect(() => {
    const calcAll = async () => {
      const updated = await Promise.all(
        items.map(async (it) => {
          if (!it.cfop) return it;
          try {
            const calc = await calculateItemTaxes({
              ncm: it.ncm || null,
              cfop: it.cfop,
              quantity: it.quantity,
              unit_price: it.unitPrice,
            });
            return {
              ...it,
              icms: calc.icms_value,
              pis: calc.pis_value,
              cofins: calc.cofins_value,
              ipi: calc.ipi_value,
            };
          } catch {
            // Fallback simples: ICMS 18%, PIS 1.65%, COFINS 7.6%
            const base = it.quantity * it.unitPrice;
            return {
              ...it,
              icms: base * 0.18,
              pis: base * 0.0165,
              cofins: base * 0.076,
              ipi: 0,
            };
          }
        })
      );
      // Só atualiza se algo mudou
      const changed = updated.some((u, i) => u.icms !== items[i]?.icms);
      if (changed) setItems(updated);
    };
    if (items.length > 0) calcAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, items.map((i) => `${i.cfop}-${i.quantity}-${i.unitPrice}-${i.ncm}`).join('|')]);

  const clientOptions: SmartSelectOption[] = useMemo(
    () => clients.map((c) => ({
      value: c.id,
      label: c.name,
      description: c.document,
      meta: `${c.address_city || ''}/${c.address_state || ''}`,
    })),
    [clients]
  );

  const productOptions: SmartSelectOption[] = useMemo(
    () => products.map((p) => ({
      value: p.id,
      label: p.name,
      description: `Cód: ${p.code}`,
      meta: fmt(p.sale_price),
    })),
    [products]
  );

  const handleSelectClient = (id: string) => {
    const c = clients.find((cl) => cl.id === id);
    if (!c) return;
    setClientId(id);
    setClientName(c.name);
    setClientDocument(c.document);
    setClientUF(c.address_state || '');
  };

  const handleAddProduct = (productId: string) => {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        productCode: p.code,
        productName: p.name,
        productId: p.id,
        ncm: '',
        cfop: defaultCfop,
        unit: p.unit || 'UN',
        quantity: 1,
        unitPrice: p.sale_price,
      },
    ]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof NFeItemForm, value: string | number) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalIcms = items.reduce((s, i) => s + (i.icms || 0), 0);
  const totalPis = items.reduce((s, i) => s + (i.pis || 0), 0);
  const totalCofins = items.reduce((s, i) => s + (i.cofins || 0), 0);
  const totalIpi = items.reduce((s, i) => s + (i.ipi || 0), 0);
  const totalTaxes = totalIcms + totalPis + totalCofins + totalIpi;
  const total = subtotal - discount + shipping;

  const canAdvance = useMemo(() => {
    switch (step) {
      case 0: return !!operationType && !!naturezaOp;
      case 1: return !!clientName.trim();
      case 2: return items.length > 0;
      default: return true;
    }
  }, [step, operationType, naturezaOp, clientName, items.length]);

  const handleNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!clientName.trim() || items.length === 0) return;
    setSaving(true);
    await onCreate({
      clientName,
      clientId: clientId || undefined,
      clientDocument: clientDocument || undefined,
      operationType,
      items: items.map((i) => ({
        productCode: i.productCode,
        productName: i.productName,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unit: i.unit,
        ncm: i.ncm,
        cfop: i.cfop,
      })),
      discount,
      shipping,
    });
    setSaving(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setStep(0);
    setOperationType('saida');
    setNaturezaOp('Venda de mercadoria');
    setDefaultCfop('5102');
    setClientId('');
    setClientName('');
    setClientDocument('');
    setClientUF('');
    setItems([]);
    setCarrierName('');
    setFreightType('1');
    setShipping(0);
    setVolumeQty(1);
    setPaymentMethod('99');
    setInstallments(1);
    setDiscount(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Emissão de NF-e
          </DialogTitle>
          <DialogDescription>
            Fluxo guiado em {STEPS.length} etapas — sistema calcula impostos automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2">
          <FiscalStepper steps={STEPS} currentStep={step} onStepClick={setStep} />
        </div>

        <div className="px-6 py-4 min-h-[380px]">
          {/* ETAPA 1: DADOS DA NOTA */}
          {step === 0 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-base font-semibold">Dados principais da nota</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de operação</Label>
                  <Select value={operationType} onValueChange={setOperationType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saida">Saída (venda/remessa)</SelectItem>
                      <SelectItem value="entrada">Entrada (compra/devolução)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CFOP padrão (sugerido)</Label>
                  <Select value={defaultCfop} onValueChange={setDefaultCfop}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cfopOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    Atualizado automaticamente conforme UF do cliente
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Natureza da operação</Label>
                  <Input value={naturezaOp} onChange={(e) => setNaturezaOp(e.target.value)} placeholder="Ex: Venda de mercadoria" />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: CLIENTE */}
          {step === 1 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-base font-semibold">Cliente / Destinatário</h3>
              <div className="space-y-2">
                <Label>Selecionar cliente</Label>
                <SmartSelect
                  options={clientOptions}
                  value={clientId}
                  onChange={(id) => handleSelectClient(id)}
                  placeholder="Buscar por nome, CNPJ ou cidade..."
                />
              </div>
              {clientName && (
                <Card className="p-4 bg-muted/30">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">CNPJ/CPF</Label>
                      <Input value={clientDocument} onChange={(e) => setClientDocument(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">UF</Label>
                      <Input value={clientUF} onChange={(e) => setClientUF(e.target.value.toUpperCase())} maxLength={2} />
                    </div>
                  </div>
                  {clientUF && clientUF !== 'SP' && (
                    <p className="text-xs text-warning mt-3">
                      <Sparkles className="inline h-3 w-3 mr-1" />
                      Operação interestadual — DIFAL será calculado automaticamente
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ETAPA 3: PRODUTOS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Produtos / Serviços</h3>
                <Badge variant="secondary">{items.length} {items.length === 1 ? 'item' : 'itens'}</Badge>
              </div>
              <div className="space-y-2">
                <Label>Adicionar produto</Label>
                <SmartSelect
                  options={productOptions}
                  value=""
                  onChange={(id) => handleAddProduct(id)}
                  placeholder="Buscar por nome ou código..."
                />
              </div>

              {items.length > 0 && (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-24">CFOP</TableHead>
                        <TableHead className="w-20">Qtd</TableHead>
                        <TableHead className="w-28">Valor Unit.</TableHead>
                        <TableHead className="w-24 text-right">ICMS</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="text-sm font-medium">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.productCode}</div>
                          </TableCell>
                          <TableCell>
                            <Select value={item.cfop} onValueChange={(v) => updateItem(idx, 'cfop', v)}>
                              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {cfopOptions.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={item.unitPrice}
                              onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                              className="h-8 w-28"
                            />
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                            {fmt(item.icms || 0)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {fmt(item.quantity * item.unitPrice)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  Nenhum item adicionado. Use o seletor acima para incluir produtos.
                </div>
              )}
            </div>
          )}

          {/* ETAPA 4: IMPOSTOS */}
          {step === 3 && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-semibold">Impostos calculados</h3>
                <p className="text-sm text-muted-foreground">
                  O sistema calcula automaticamente baseado em CFOP, NCM e UF — você não precisa fazer nada.
                </p>
              </div>
              <TaxSummaryCard
                icms={totalIcms}
                pis={totalPis}
                cofins={totalCofins}
                ipi={totalIpi}
                total={subtotal}
                totalTaxes={totalTaxes}
              />
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Detalhe por item</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                      <span className="truncate flex-1">{it.productName}</span>
                      <div className="flex gap-3 text-xs text-muted-foreground tabular-nums">
                        <span>ICMS: {fmt(it.icms || 0)}</span>
                        <span>PIS: {fmt(it.pis || 0)}</span>
                        <span>COFINS: {fmt(it.cofins || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ETAPA 5: TRANSPORTE */}
          {step === 4 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-base font-semibold">Transporte</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modalidade do frete</Label>
                  <Select value={freightType} onValueChange={setFreightType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 — Por conta do emitente (CIF)</SelectItem>
                      <SelectItem value="1">1 — Por conta do destinatário (FOB)</SelectItem>
                      <SelectItem value="2">2 — Por conta de terceiros</SelectItem>
                      <SelectItem value="9">9 — Sem ocorrência de transporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="Nome (opcional)" />
                </div>
                <div className="space-y-2">
                  <Label>Valor do frete (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={shipping} onChange={(e) => setShipping(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade de volumes</Label>
                  <Input type="number" min={1} value={volumeQty} onChange={(e) => setVolumeQty(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 6: FINANCEIRO */}
          {step === 5 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-base font-semibold">Financeiro</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="01">Dinheiro</SelectItem>
                      <SelectItem value="03">Cartão de crédito</SelectItem>
                      <SelectItem value="04">Cartão de débito</SelectItem>
                      <SelectItem value="15">Boleto bancário</SelectItem>
                      <SelectItem value="17">PIX</SelectItem>
                      <SelectItem value="99">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Input type="number" min={1} max={36} value={installments} onChange={(e) => setInstallments(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Valor da parcela</Label>
                  <Input value={fmt(total / Math.max(installments, 1))} disabled />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 7: REVISÃO */}
          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Revisão e emissão
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                <Card className="p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Destinatário</div>
                  <div className="font-medium">{clientName}</div>
                  <div className="text-sm text-muted-foreground">{clientDocument} • {clientUF}</div>
                </Card>
                <Card className="p-4 space-y-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Operação</div>
                  <div className="font-medium">{naturezaOp}</div>
                  <div className="text-sm text-muted-foreground">CFOP {defaultCfop} • {operationType === 'saida' ? 'Saída' : 'Entrada'}</div>
                </Card>
              </div>

              <Card className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Itens ({items.length})</div>
                <div className="space-y-1 max-h-32 overflow-y-auto text-sm">
                  {items.map((i, idx) => (
                    <div key={idx} className="flex justify-between border-b last:border-0 py-1">
                      <span className="truncate flex-1">{i.quantity}x {i.productName}</span>
                      <span className="font-medium tabular-nums">{fmt(i.quantity * i.unitPrice)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                <TaxSummaryCard
                  icms={totalIcms}
                  pis={totalPis}
                  cofins={totalCofins}
                  ipi={totalIpi}
                  total={subtotal}
                  totalTaxes={totalTaxes}
                />
                <Card className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="tabular-nums text-destructive">-{fmt(discount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="tabular-nums">{fmt(shipping)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-baseline">
                    <span className="text-sm font-medium">Total da nota</span>
                    <span className="text-2xl font-bold text-primary tabular-nums">{fmt(total)}</span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-muted/20 px-6 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} disabled={!canAdvance}>
                Avançar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving || items.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {saving ? 'Emitindo...' : 'Emitir NF-e'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
