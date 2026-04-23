import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, FileText, Users, Package, Calculator,
  Truck, CreditCard, ClipboardCheck, ArrowLeft, ArrowRight, Send, Sparkles,
  Info, AlertCircle, CheckCircle2, ChevronRight, Scale, Receipt, AlertTriangle, ListChecks, Filter, Search, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cfopOptions } from '@/config/fiscal';
import { useClients } from '@/hooks/useClients';
import { useProducts } from '@/hooks/useProducts';
import { calculateItemTaxes } from '@/hooks/useTaxRules';
import { FiscalStepper } from './FiscalStepper';
import { SmartSelect, SmartSelectOption } from './SmartSelect';
import { TaxSummaryCard } from './TaxSummaryCard';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HighlightText } from '@/components/shared/HighlightText';


interface NFeItemForm {
  productCode: string;
  productName: string;
  productId?: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  icms?: number;
  pis?: number;
  cofins?: number;
  ipi?: number;
}

const highlightText = (text: string, search: string) => <HighlightText text={text} search={search} />;



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
  { id: 'taxes', label: 'Tributos', icon: Calculator },
  { id: 'transport', label: 'Logística', icon: Truck },
  { id: 'finance', label: 'Pagamento', icon: CreditCard },
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
  const [freightType, setFreightType] = useState('1'); 
  const [shipping, setShipping] = useState(0);
  const [volumeQty, setVolumeQty] = useState(1);

  // Etapa 6 — Financeiro
  const [paymentMethod, setPaymentMethod] = useState('99');
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [diagnosisFilter, setDiagnosisFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDiagnosisSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!clientUF) return;
    const sameState = clientUF === 'SP';
    const newCfop = operationType === 'saida' ? (sameState ? '5102' : '6102') : '1102';
    setDefaultCfop(newCfop);
    setItems((prev) => prev.map((i) => ({ ...i, cfop: newCfop })));
  }, [clientUF, operationType]);

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
      const changed = updated.some((u, i) => u.icms !== items[i]?.icms);
      if (changed) setItems(updated);
    };
    if (items.length > 0) calcAll();
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
  const total = subtotal - discount + shipping;

  const validationByStep = useMemo(() => {
    const steps: Record<number, { errors: string[]; warnings: string[] }> = {};
    STEPS.forEach((_, i) => (steps[i] = { errors: [], warnings: [] }));

    // Etapa 0 — Dados
    if (!naturezaOp.trim()) {
      steps[0].errors.push("Natureza da operação é obrigatória para a validade jurídica da NF-e.");
    }

    // Etapa 1 — Cliente
    if (!clientId) {
      steps[1].errors.push("O destinatário é obrigatório. Selecione um cliente da base.");
    }
    if (clientDocument && clientDocument.replace(/\D/g, "").length < 11) {
      steps[1].errors.push("O documento do destinatário (CPF/CNPJ) parece estar incompleto.");
    }
    if (!clientUF) {
      steps[1].errors.push("UF do destinatário não identificada. Verifique o cadastro.");
    }

    // Etapa 2 — Produtos
    if (items.length === 0) {
      steps[2].errors.push("A nota precisa conter pelo menos um item para ser emitida.");
    }
    items.forEach((item, idx) => {
      if (!item.cfop) {
        steps[2].errors.push(`Item ${idx + 1} (${item.productName}): O código CFOP é obrigatório.`);
      }
      if (!item.ncm) {
        steps[2].warnings.push(`Item ${idx + 1}: NCM não informado. Isso pode causar rejeição pela SEFAZ.`);
      }
      if (item.quantity <= 0) {
        steps[2].errors.push(`Item ${idx + 1}: A quantidade deve ser maior que zero.`);
      }
      if (item.unitPrice <= 0) {
        steps[2].errors.push(`Item ${idx + 1}: O valor unitário não pode ser zero.`);
      }
    });

    // Etapa 3 — Tributos
    const totalTax = totalIcms + totalIpi + totalPis + totalCofins;
    if (totalTax === 0 && subtotal > 0) {
      steps[3].warnings.push("Atenção: O valor total de impostos está zerado. Verifique as regras.");
    }

    // Etapa 5 — Pagamento
    if (!paymentMethod) {
      steps[5].errors.push("Informe o meio de pagamento utilizado.");
    }
    if (installments < 1) {
      steps[5].errors.push("O número de parcelas deve ser pelo menos 1.");
    }

    return steps;
  }, [
    naturezaOp,
    clientId,
    clientDocument,
    clientUF,
    items,
    paymentMethod,
    totalIcms,
    totalIpi,
    totalPis,
    totalCofins,
    subtotal,
    installments,
  ]);

  const allIssues = useMemo(() => {
    const errors: { step: number; message: string }[] = [];
    const warnings: { step: number; message: string }[] = [];
    Object.entries(validationByStep).forEach(([s, data]) => {
      const stepIdx = Number(s);
      data.errors.forEach((m) => errors.push({ step: stepIdx, message: m }));
      data.warnings.forEach((m) => warnings.push({ step: stepIdx, message: m }));
    });
    return { errors, warnings, total: errors.length + warnings.length };
  }, [validationByStep]);

  const hasFilteredErrors = useMemo(() => {
    return Object.values(validationByStep).some(data => 
      data.errors.some(err => err.toLowerCase().includes(diagnosisSearch.toLowerCase()))
    );
  }, [validationByStep, diagnosisSearch]);

  const hasFilteredWarnings = useMemo(() => {
    return Object.values(validationByStep).some(data => 
      data.warnings.some(warn => warn.toLowerCase().includes(diagnosisSearch.toLowerCase()))
    );
  }, [validationByStep, diagnosisSearch]);

  const currentStepValidation = validationByStep[step] || { errors: [], warnings: [] };
  const hasBlockingErrors = currentStepValidation.errors.length > 0;
  const hasAnyBlockingErrors = allIssues.errors.length > 0;

  const nothingFoundInView = useMemo(() => {
    if (diagnosisFilter === 'all') return !hasFilteredErrors && !hasFilteredWarnings;
    if (diagnosisFilter === 'errors') return !hasFilteredErrors;
    if (diagnosisFilter === 'warnings') return !hasFilteredWarnings;
    return true;
  }, [diagnosisFilter, hasFilteredErrors, hasFilteredWarnings]);

  const handleNext = () => {
    if (hasBlockingErrors) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (hasBlockingErrors) return;
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
    onOpenChange(false);
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
                Emissão de NF-e Profissional
              </DialogTitle>
              <DialogDescription>Fluxo automatizado com cálculo de impostos em tempo real</DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Sheet onOpenChange={(open) => {
                if (!open) {
                  setSearchTerm('');
                  setDiagnosisFilter('all');
                }
              }}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-2", allIssues.total > 0 ? "border-warning text-warning hover:bg-warning/5" : "border-success text-success hover:bg-success/5")}>
                    <ListChecks className="h-4 w-4" />
                    Inconsistências ({allIssues.total})
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  className="w-[400px] sm:w-[540px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && (searchTerm || diagnosisFilter !== 'all')) {
                      setSearchTerm('');
                      setDiagnosisFilter('all');
                      e.preventDefault();
                    }
                  }}
                >
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Diagnóstico de Emissão
                    </SheetTitle>
                    <SheetDescription>
                      Resumo de todas as validações pendentes para a autorização da nota.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Filtrar por texto das inconsistências..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        {(searchTerm || diagnosisFilter !== 'all') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-3 text-xs gap-1 border-dashed hover:border-solid transition-all"
                            onClick={() => {
                              setSearchTerm('');
                              setDiagnosisFilter('all');
                            }}
                          >
                            <X className="h-3 w-3" />
                            Limpar
                          </Button>
                        )}
                      </div>
                      <SearchHint keys="Esc">
                        para limpar a busca e voltar o filtro para Tudo
                      </SearchHint>

                    </div>

                    <Tabs value={diagnosisFilter} onValueChange={(v: any) => setDiagnosisFilter(v)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all" className="text-xs">Tudo ({allIssues.total})</TabsTrigger>
                        <TabsTrigger value="errors" className="text-xs">Erros ({allIssues.errors.length})</TabsTrigger>
                        <TabsTrigger value="warnings" className="text-xs">Sugestões ({allIssues.warnings.length})</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <ScrollArea className="h-[calc(100vh-210px)] pr-4">
                    <div className="space-y-6">
                      {(diagnosisFilter === 'all' || diagnosisFilter === 'errors') && hasFilteredErrors && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-destructive font-bold text-[10px] uppercase tracking-widest bg-destructive/5 p-2 rounded-t-lg border-b border-destructive/10">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Erros Críticos (Bloqueantes)
                          </div>
                          <div className="space-y-5 px-1">
                            {STEPS.map((s, idx) => {
                              const stepIssues = validationByStep[idx];
                              const filteredErrors = stepIssues.errors.filter(err => 
                                err.toLowerCase().includes(diagnosisSearch.toLowerCase())
                              );
                              if (filteredErrors.length === 0) return null;
                              return (
                                <div key={`err-group-${idx}`} className="space-y-2">
                                  <div className="flex items-center gap-2 border-b border-dashed pb-1">
                                    <Badge variant="outline" className="h-5 text-[10px] px-1.5">{s.label}</Badge>
                                    <Button variant="ghost" size="sm" onClick={() => { setStep(idx); }} className="ml-auto text-[10px] h-5">Corrigir</Button>
                                  </div>
                                  {filteredErrors.map((err, i) => (
                                    <div key={`err-${idx}-${i}`} className="flex gap-2 text-xs text-destructive pl-1">
                                      <div className="w-1 h-1 rounded-full bg-destructive mt-1.5 shrink-0" />
                                      <span>{highlightText(err, diagnosisSearch)}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {(diagnosisFilter === 'all' || diagnosisFilter === 'warnings') && hasFilteredWarnings && (
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-widest bg-amber-50 p-2 rounded-t-lg border-b border-amber-200/50">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Sugestões de Melhoria
                          </div>
                          <div className="space-y-5 px-1">
                            {STEPS.map((s, idx) => {
                              const stepIssues = validationByStep[idx];
                              const filteredWarnings = stepIssues.warnings.filter(warn => 
                                warn.toLowerCase().includes(diagnosisSearch.toLowerCase())
                              );
                              if (filteredWarnings.length === 0) return null;
                              return (
                                <div key={`warn-group-${idx}`} className="space-y-2">
                                  <div className="flex items-center gap-2 border-b border-dashed pb-1">
                                    <Badge variant="outline" className="h-5 text-[10px] px-1.5">{s.label}</Badge>
                                    <Button variant="ghost" size="sm" onClick={() => { setStep(idx); }} className="ml-auto text-[10px] h-5">Corrigir</Button>
                                  </div>
                                  {filteredWarnings.map((warn, i) => (
                                    <div key={`warn-${idx}-${i}`} className="flex gap-2 text-xs text-amber-700 pl-1">
                                      <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                      <span>{highlightText(warn, diagnosisSearch)}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {nothingFoundInView && (
                        <div className="py-20 text-center space-y-3">
                          {diagnosisSearch ? (
                            <>
                              <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                              <p className="text-sm text-muted-foreground font-medium">Nenhum resultado para "{diagnosisSearch}"</p>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-12 w-12 mx-auto text-success opacity-20" />
                              <p className="text-sm text-muted-foreground font-medium">Nenhuma inconsistência detectada!</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              <Badge variant="outline" className="bg-background">Série: 001</Badge>
              <Badge variant="outline" className="bg-background">Ambiente: Homologação</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="px-10 py-6 border-b">
          <FiscalStepper steps={STEPS} currentStep={step} onStepClick={setStep} />
        </div>

        <div className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full">
            <div className="px-8 py-6 max-w-5xl mx-auto">
              <div className="mb-6 space-y-3">
                {currentStepValidation.errors.map((err, i) => (
                  <Alert key={`err-${i}`} variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Inconsistência Fiscal</AlertTitle>
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                ))}
                {currentStepValidation.warnings.map((warn, i) => (
                  <Alert key={`warn-${i}`} className="bg-amber-50 border-amber-200 text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Sugestão de Correção</AlertTitle>
                    <AlertDescription>{warn}</AlertDescription>
                  </Alert>
                ))}
              </div>

              {step === 0 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Info className="h-5 w-5" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Informações da Operação</h3>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Movimentação</Label>
                        <Select value={operationType} onValueChange={setOperationType}>
                          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saida">Saída (Venda/Remessa)</SelectItem>
                            <SelectItem value="entrada">Entrada (Compra/Devolução)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Natureza da Operação</Label>
                        <Input value={naturezaOp} onChange={(e) => setNaturezaOp(e.target.value)} className="h-12" placeholder="Ex: Venda de mercadoria" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Configuração Inteligente</h3>
                      </div>
                      <div className="bg-muted/50 p-5 rounded-xl border border-dashed border-primary/20 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Sugestão de CFOP Padrão</Label>
                          <Select value={defaultCfop} onValueChange={setDefaultCfop}>
                            <SelectTrigger className="bg-background h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {cfopOptions.map((c) => (
                                <SelectItem key={c.value} value={c.value}>{c.value} - {c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                          * O sistema ajustará o CFOP automaticamente conforme a UF do destinatário na próxima etapa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-2xl space-y-4">
                      <Label className="text-center block text-lg font-semibold">Quem é o destinatário desta nota?</Label>
                      <SmartSelect
                        options={clientOptions}
                        value={clientId}
                        onChange={(id) => handleSelectClient(id)}
                        placeholder="Busque por Nome, CPF ou CNPJ..."
                      />
                    </div>

                    {clientName && (
                      <Card className="w-full max-w-3xl border-primary/20 bg-primary/5 shadow-lg overflow-hidden transition-all">
                        <div className="bg-primary px-6 py-2 text-primary-foreground text-xs font-bold uppercase tracking-widest flex items-center justify-between">
                          <span>Cliente Selecionado</span>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Razão Social / Nome</Label>
                            <p className="font-bold text-lg">{clientName}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Documento</Label>
                            <p className="font-mono">{clientDocument}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground">Estado (UF)</Label>
                            <div className="flex items-center gap-2">
                              <Badge className="font-bold">{clientUF}</Badge>
                              {clientUF !== 'SP' && <Badge variant="secondary" className="text-[10px] bg-warning/20 text-warning border-warning">Interestadual</Badge>}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold">Listagem de Itens</h3>
                      <p className="text-sm text-muted-foreground">Adicione os produtos ou serviços que compõem esta nota</p>
                    </div>
                    <div className="w-96">
                      <SmartSelect
                        options={productOptions}
                        value=""
                        onChange={(id) => handleAddProduct(id)}
                        placeholder="Adicionar produto..."
                      />
                    </div>
                  </div>

                  {items.length > 0 ? (
                    <div className="rounded-2xl border shadow-xl overflow-hidden bg-background">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[350px]">Produto</TableHead>
                            <TableHead className="w-[120px]">CFOP</TableHead>
                            <TableHead className="w-[100px]">Qtd</TableHead>
                            <TableHead className="w-[150px]">Preço Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, idx) => (
                            <TableRow key={idx} className="hover:bg-muted/30 group">
                              <TableCell className="py-4">
                                <div className="font-bold">{item.productName}</div>
                                <div className="text-[10px] text-muted-foreground flex gap-2 mt-1">
                                  <span>CÓD: {item.productCode}</span>
                                  <span>•</span>
                                  <span>UN: {item.unit}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select value={item.cfop} onValueChange={(v) => updateItem(idx, 'cfop', v)}>
                                  <SelectTrigger className="h-9 font-mono text-xs"><SelectValue /></SelectTrigger>
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
                                  value={item.quantity}
                                  onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                  className="h-9 font-bold text-center"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                                  <Input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                    className="h-9 pl-6 font-bold"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-bold tabular-nums">
                                {fmt(item.quantity * item.unitPrice)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
                      <Package className="h-16 w-16 mx-auto opacity-10 mb-4" />
                      <p className="text-muted-foreground">Nenhum item adicionado ainda.</p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
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
                              <TableCell className="text-right tabular-nums text-xs">{fmt(item.icms || 0)}</TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmt(item.ipi || 0)}</TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmt(item.pis || 0)}</TableCell>
                              <TableCell className="text-right tabular-nums text-xs">{fmt(item.cofins || 0)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Truck className="h-5 w-5" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Dados do Transportador</h3>
                      </div>
                      <div className="space-y-2">
                        <Label>Transportadora</Label>
                        <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="Busque ou digite o nome..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Modalidade do Frete</Label>
                        <Select value={freightType} onValueChange={setFreightType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0 - Por conta do emitente</SelectItem>
                            <SelectItem value="1">1 - Por conta do destinatário</SelectItem>
                            <SelectItem value="2">2 - Por conta de terceiros</SelectItem>
                            <SelectItem value="9">9 - Sem frete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Scale className="h-5 w-5" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Volumes e Peso</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Quantidade de Volumes</Label>
                          <Input type="number" value={volumeQty} onChange={(e) => setVolumeQty(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Valor do Frete</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                            <Input type="number" value={shipping} onChange={(e) => setShipping(Number(e.target.value))} className="pl-8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center space-y-2">
                      <CreditCard className="h-12 w-12 mx-auto text-primary opacity-50" />
                      <h3 className="text-xl font-bold">Condições de Pagamento</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="01">Dinheiro</SelectItem>
                            <SelectItem value="03">Cartão de Crédito</SelectItem>
                            <SelectItem value="04">Cartão de Débito</SelectItem>
                            <SelectItem value="15">Boleto Bancário</SelectItem>
                            <SelectItem value="17">PIX</SelectItem>
                            <SelectItem value="99">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Parcelas</Label>
                          <Input type="number" min={1} value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label>Desconto Total</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                            <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-12 pl-8" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
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
                                <span className="font-mono">{fmt(it.quantity * it.unitPrice)}</span>
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
                          <div className="text-4xl font-black tabular-nums text-primary mb-1">{fmt(total)}</div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Valor Líquido da Nota</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal Itens</span>
                            <span className="font-bold">{fmt(subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-destructive">
                            <span className="text-muted-foreground">Descontos</span>
                            <span className="font-bold">-{fmt(discount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete</span>
                            <span className="font-bold">+{fmt(shipping)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-success">
                            <span className="font-bold">Total de Tributos</span>
                            <span className="font-bold">{fmt(totalIcms + totalIpi + totalPis + totalCofins)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-8 py-4 border-t bg-muted/30 flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-6 h-11">Sair</Button>
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={handlePrev} className="px-6 h-11 gap-2 border-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button 
                onClick={handleNext} 
                disabled={hasBlockingErrors}
                className={cn(
                  "px-8 h-11 gap-2 shadow-lg transition-all",
                  hasBlockingErrors ? "opacity-50 grayscale cursor-not-allowed" : "shadow-primary/20"
                )}
              >
                Avançar <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={saving || hasBlockingErrors} 
                className={cn(
                  "px-10 h-11 gap-2 bg-success hover:bg-success/90 shadow-lg transition-all",
                  hasBlockingErrors ? "opacity-50 grayscale cursor-not-allowed" : "shadow-success/20"
                )}
              >
                {saving ? 'Processando...' : <><Send className="h-4 w-4" /> Gerar NF-e</>}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}