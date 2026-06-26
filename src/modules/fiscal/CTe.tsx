import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Send, Ban, Plus, Truck, MapPin, DollarSign, ClipboardCheck, ArrowLeft, ArrowRight, FileText, Search, Sparkles, Receipt, ChevronRight, Calculator, ListChecks, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/ui/base/separator';
import { useCTes, useCreateCTe, useTransmitCTe, useCancelCTe } from '@/hooks/fiscal/useCTe';
import { useFiscal } from '@/hooks/fiscal/useFiscal';
import { format } from 'date-fns';
import { FiscalStepper } from '@/components/fiscal/FiscalStepper';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';
import { ScrollArea } from '@/ui/base/scroll-area';
import { SmartSelect } from '@/components/fiscal/SmartSelect';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/ui/base/sheet';
import { Badge } from '@/ui/base/badge';
import { HighlightText } from '@/shared/components/HighlightText';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/ui/base/alert';

import { formatBRL } from '@/lib/formatters';
import { toSafeNumber } from '@/lib/numericValidation';
const STEPS = [
  { id: 'import', label: 'Importar NF-e', icon: FileText },
  { id: 'parts', label: 'Participantes', icon: Truck },
  { id: 'route', label: 'Rota', icon: MapPin },
  { id: 'freight', label: 'Valores', icon: DollarSign },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];


export default function CTePage() {
  const { data: ctes = [], isLoading } = useCTes();
  const { nfes } = useFiscal();
  const createCTe = useCreateCTe();
  const transmit = useTransmitCTe();
  const cancel = useCancelCTe();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
   const [selectedNFeId, setSelectedNFeId] = useState('');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');

  const [form, setForm] = useState({
    carrier_name: 'TRANSPORTADORA LOGISTICA LTDA', carrier_document: '12.345.678/0001-90',
    sender_name: '', sender_document: '', sender_uf: 'SP',
    recipient_name: '', recipient_document: '', recipient_uf: 'RJ',
    origin_city: '', destination_city: '',
    cargo_value: 0, freight_value: 0, icms_rate: 12, modal: 'rodoviario',
  });

  const validationByStep = useMemo(() => {
    const steps: Record<number, { errors: string[]; warnings: string[] }> = {};
    STEPS.forEach((_, i) => (steps[i] = { errors: [], warnings: [] }));

    // Etapa 0 — Importação
    if (step > 0 && !selectedNFeId) {
      steps[0].warnings.push("CT-e criado sem importar dados de NF-e. Certifique-se de que os dados manuais estão corretos.");
    }

    // Etapa 1 — Participantes
    if (!form.sender_name) steps[1].errors.push("O remetente é obrigatório.");
    if (!form.recipient_name) steps[1].errors.push("O destinatário é obrigatório.");
    if (form.sender_document && form.sender_document.replace(/\D/g, '').length < 11) {
      steps[1].warnings.push("Documento do remetente parece inválido.");
    }

    // Etapa 2 — Rota
    if (!form.sender_uf) steps[2].errors.push("UF de origem é obrigatória.");
    if (!form.recipient_uf) steps[2].errors.push("UF de destino é obrigatória.");
    if (!form.origin_city) steps[2].errors.push("Cidade de origem é obrigatória.");
    if (!form.destination_city) steps[2].errors.push("Cidade de destino é obrigatória.");

    // Etapa 3 — Valores
    if (form.cargo_value <= 0) steps[3].errors.push("O valor da carga deve ser maior que zero.");
    if (form.freight_value <= 0) steps[3].errors.push("O valor do frete é obrigatório.");
    if (form.icms_rate <= 0) steps[3].warnings.push("Alíquota de ICMS zerada. Verifique se há isenção.");

    return steps;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `step` é referenciado apenas para indexar mensagens já capturadas
  }, [form, selectedNFeId]);

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


  const nfeOptions = useMemo(() => 
    nfes.filter(n => n.status === 'authorized').map(n => ({
      value: n.id,
      label: `NF-e ${n.number} - ${n.clientName}`,
      description: `Valor: ${formatBRL(n.total)}`,
      meta: n.issueDate
    })), [nfes]);

  const handleImportNFe = (id: string) => {
    const nfe = nfes.find(n => n.id === id);
    if (!nfe) return;
    setSelectedNFeId(id);
    setForm(prev => ({
      ...prev,
      sender_name: 'NOSSA EMPRESA LTDA', // Emitente da NFe é o remetente do CTe
      sender_document: '00.111.222/0001-33',
      sender_uf: 'SP',
      recipient_name: nfe.clientName,
      recipient_document: nfe.clientDocument,
      recipient_uf: 'RJ', // Simplificado
      cargo_value: nfe.total,
      freight_value: nfe.total * 0.05, // Sugestão 5%
    }));
    setStep(1);
  };

  const handleCreate = async () => {
    await createCTe.mutateAsync(form as any);
    setOpen(false);
    setStep(0);
    setSelectedNFeId('');
  };

  const totals = ctes.reduce(
    (acc, c) => ({
      total: acc.total + Number(c.total),
      authorized: acc.authorized + (c.status === 'authorized' ? 1 : 0),
    }),
    { total: 0, authorized: 0 }
  );

  const icmsValue = (form.freight_value * form.icms_rate) / 100;

  return (
    <PageContainer>
      <PageHeader
        title="CT-e — Conhecimento de Transporte"
        description="Emissão guiada de CT-e em 4 etapas, com auto-cálculo de ICMS"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep(0); setSelectedNFeId(''); } }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"><Plus className="mr-2 h-4 w-4" />Novo CT-e</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="border-b px-8 py-6 bg-muted/30">
                <div className="space-y-1">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    Emissão de CT-e Rodoviário
                  </DialogTitle>
                  <DialogDescription>Conhecimento de Transporte Eletrônico guiado</DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("gap-2", allIssues.total > 0 ? "border-warning text-warning hover:bg-warning/5" : "border-success text-success hover:bg-success/5")}>
                        <ListChecks className="h-4 w-4" />
                        Inconsistências ({allIssues.total})
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px]">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          Diagnóstico de CT-e
                        </SheetTitle>
                        <SheetDescription>
                          Resumo das validações pendentes para a emissão do CT-e.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Filtrar por texto das inconsistências..." 
                            className="pl-9"
                            value={diagnosisSearch}
                            onChange={(e) => setDiagnosisSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      <ScrollArea className="h-[calc(100vh-210px)] mt-6 pr-4">
                        <div className="space-y-6">
                          {STEPS.map((s, idx) => {
                            const stepIssues = validationByStep[idx];
                            const filteredErrors = stepIssues.errors.filter(err => 
                              err.toLowerCase().includes(diagnosisSearch.toLowerCase())
                            );
                            const filteredWarnings = stepIssues.warnings.filter(warn => 
                              warn.toLowerCase().includes(diagnosisSearch.toLowerCase())
                            );

                            if (filteredErrors.length === 0 && filteredWarnings.length === 0) return null;
                            
                            return (
                              <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-2 border-b pb-1">
                                  <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">{idx + 1}</Badge>
                                  <h4 className="text-sm font-bold uppercase tracking-wider">{s.label}</h4>
                                  <Button variant="ghost" size="sm" onClick={() => { setStep(idx); }} className="ml-auto text-[10px] h-6">Corrigir</Button>
                                </div>
                                {filteredErrors.map((err, i) => (
                                  <div key={`err-${idx}-${i}`} className="flex gap-2 text-xs text-destructive bg-destructive/5 p-2 rounded-md">
                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span><HighlightText text={err} search={diagnosisSearch} /></span>
                                  </div>
                                ))}
                                {filteredWarnings.map((warn, i) => (
                                  <div key={`warn-${idx}-${i}`} className="flex gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md">
                                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span><HighlightText text={warn} search={diagnosisSearch} /></span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                          {(allIssues.total === 0 || (diagnosisSearch && !STEPS.some((_, idx) => 
                            validationByStep[idx].errors.some(err => err.toLowerCase().includes(diagnosisSearch.toLowerCase())) ||
                            validationByStep[idx].warnings.some(warn => warn.toLowerCase().includes(diagnosisSearch.toLowerCase()))
                          ))) && (
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
                </div>
              </DialogHeader>

              <div className="px-10 py-6 border-b">
                <FiscalStepper steps={STEPS} currentStep={step} onStepClick={setStep} />
              </div>

              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                  <div className="px-8 py-6 max-w-3xl mx-auto">
                    <div className="mb-6 space-y-3">
                      {validationByStep[step]?.errors.map((err, i) => (
                        <Alert key={`err-${i}`} variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Inconsistência Fiscal</AlertTitle>
                          <AlertDescription>{err}</AlertDescription>
                        </Alert>
                      ))}
                      {validationByStep[step]?.warnings.map((warn, i) => (
                        <Alert key={`warn-${i}`} className="bg-amber-50 border-amber-200 text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800">Sugestão de Correção</AlertTitle>
                          <AlertDescription>{warn}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                    {step === 0 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-4 py-8 border-2 border-dashed rounded-3xl bg-muted/10">
                          <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold">Importar Dados da NF-e</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Selecione uma nota autorizada para preencher os dados do transporte automaticamente</p>
                          </div>
                          <div className="max-w-md mx-auto px-4">
                            <SmartSelect
                              options={nfeOptions as any}
                              value={selectedNFeId}
                              onChange={handleImportNFe}
                              placeholder="Pesquisar NF-e por número ou cliente..."
                            />
                          </div>
                          <Button variant="ghost" onClick={() => setStep(1)} className="text-primary hover:bg-primary/5">
                            Pular importação e preencher manualmente <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                              <Search className="h-4 w-4" />
                              <h4 className="text-xs font-bold uppercase tracking-widest">Remetente (Quem envia)</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nome/Razão Social</Label>
                                <Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>CNPJ/CPF</Label>
                                <Input value={form.sender_document} onChange={(e) => setForm({ ...form, sender_document: e.target.value })} />
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                              <Receipt className="h-4 w-4" />
                              <h4 className="text-xs font-bold uppercase tracking-widest">Destinatário (Quem recebe)</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nome/Razão Social</Label>
                                <Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>CNPJ/CPF</Label>
                                <Input value={form.recipient_document} onChange={(e) => setForm({ ...form, recipient_document: e.target.value })} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>UF Origem</Label>
                            <Input value={form.sender_uf} onChange={(e) => setForm({ ...form, sender_uf: e.target.value.toUpperCase() })} maxLength={2} className="font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label>UF Destino</Label>
                            <Input value={form.recipient_uf} onChange={(e) => setForm({ ...form, recipient_uf: e.target.value.toUpperCase() })} maxLength={2} className="font-bold" />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade Origem</Label>
                            <Input value={form.origin_city} onChange={(e) => setForm({ ...form, origin_city: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Cidade Destino</Label>
                            <Input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Modal de Transporte</Label>
                            <Select value={form.modal} onValueChange={(v) => setForm({ ...form, modal: v })}>
                              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rodoviario">🚛 Rodoviário</SelectItem>
                                <SelectItem value="aereo">✈️ Aéreo</SelectItem>
                                <SelectItem value="ferroviario">🚂 Ferroviário</SelectItem>
                                <SelectItem value="aquaviario">🚢 Aquaviário</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="text-primary font-bold">Valor da Carga Total</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                                <Input type="number" value={form.cargo_value} onChange={(e) => setForm({ ...form, cargo_value: toSafeNumber(e.target.value) })} className="pl-10 h-12 text-lg font-black" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-primary font-bold">Valor do Serviço (Frete)</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
                                <Input type="number" value={form.freight_value} onChange={(e) => setForm({ ...form, freight_value: toSafeNumber(e.target.value) })} className="pl-10 h-12 text-lg font-black" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <Card className="bg-primary/5 border-primary/20">
                              <CardHeader className="py-3 px-4 border-b">
                                <CardTitle className="text-xs uppercase font-black text-primary flex items-center gap-2">
                                  <Calculator className="h-4 w-4" /> Impostos Calculados
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-end">
                                  <span className="text-xs text-muted-foreground font-bold">ALÍQUOTA ICMS</span>
                                  <div className="flex items-center gap-2">
                                    <Input type="number" value={form.icms_rate} onChange={(e) => setForm({ ...form, icms_rate: toSafeNumber(e.target.value) })} className="w-16 h-8 p-1 text-center font-bold" />
                                    <span className="text-xs font-bold">%</span>
                                  </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold uppercase">VALOR DO ICMS</span>
                                  <span className="text-2xl font-black text-primary tabular-nums">{formatBRL((form.freight_value * form.icms_rate) / 100)}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center gap-4 mb-8">
                          <div className="bg-success/10 p-4 rounded-full text-success">
                            <ClipboardCheck className="h-10 w-10" />
                          </div>
                          <h3 className="text-2xl font-bold">Revisão Final</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <Card className="shadow-sm">
                            <CardContent className="p-5 space-y-4">
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Informações da Viagem</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Remetente:</span><span className="font-bold">{form.sender_name}</span></div>
                                <div className="flex justify-between"><span>Destinatário:</span><span className="font-bold">{form.recipient_name}</span></div>
                                <div className="flex justify-between"><span>Modal:</span><span className="font-bold uppercase text-xs">{form.modal}</span></div>
                                <div className="flex justify-between"><span>Rota:</span><span className="font-bold">{form.origin_city}/{form.sender_uf} → {form.destination_city}/{form.recipient_uf}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-primary bg-primary/5 shadow-lg">
                            <CardContent className="p-5 space-y-4">
                              <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">Resumo Financeiro</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Valor da Carga:</span><span className="font-black tabular-nums">{formatBRL(form.cargo_value)}</span></div>
                                <div className="flex justify-between"><span>Valor do Frete:</span><span className="font-black tabular-nums">{formatBRL(form.freight_value)}</span></div>
                                <div className="flex justify-between text-primary"><span>ICMS ({form.icms_rate}%):</span><span className="font-black tabular-nums">{formatBRL((form.freight_value * form.icms_rate) / 100)}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter className="border-t bg-muted/20 px-8 py-4 flex items-center justify-between sm:justify-between">
                <Button variant="ghost" onClick={() => { setOpen(false); setStep(0); }} className="px-6 h-11">Cancelar</Button>
                <div className="flex gap-3">
                  {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} className="px-6 h-11 border-2"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Button>}
                  {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(step + 1)} className="px-8 h-11 shadow-lg shadow-primary/20 transition-all">Próximo <ArrowRight className="ml-1 h-4 w-4" /></Button>
                  ) : (
                    <Button onClick={handleCreate} disabled={createCTe.isPending} className="px-10 h-11 bg-success hover:bg-success/90 shadow-lg shadow-success/20 transition-all">
                      {createCTe.isPending ? 'Emitindo...' : <><Send className="mr-2 h-4 w-4" /> Finalizar Emissão</>}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total CT-e</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{ctes.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Autorizados</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-success">{totals.authorized}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Valor Total Frete</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{formatBRL(totals.total)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conhecimentos de Transporte</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Carregando…</div> : ctes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum CT-e cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Número</TableHead><TableHead>Emissão</TableHead><TableHead>Transportadora</TableHead><TableHead>Origem→Destino</TableHead><TableHead className="text-right">Frete</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {ctes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.number}</TableCell>
                    <TableCell>{format(new Date(c.issue_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{c.carrier_name}</TableCell>
                    <TableCell className="text-sm">{c.sender_uf} → {c.recipient_uf}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(Number(c.freight_value))}</TableCell>
                    <TableCell><FiscalStatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      {c.status === 'draft' && <Button size="sm" variant="outline" onClick={() => transmit.mutate(c.id)}><Send className="h-3 w-3" /></Button>}
                      {c.status === 'authorized' && <Button size="sm" variant="ghost" onClick={() => { const r = prompt('Justificativa do cancelamento:'); if (r) cancel.mutate({ id: c.id, reason: r }); }}><Ban className="h-3 w-3" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
