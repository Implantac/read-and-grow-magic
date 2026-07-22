import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Send, Plus, Truck, ArrowLeft, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { useCTes, useCreateCTe, useTransmitCTe, useCancelCTe } from '@/hooks/fiscal/useCTe';
import { useFiscal } from '@/hooks/fiscal/useFiscal';
import { FiscalStepper } from '@/components/fiscal/FiscalStepper';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/ui/base/alert';
import { formatBRL } from '@/lib/formatters';
import { STEPS, INITIAL_FORM, type CTeForm } from './cte/constants';
import { useCTeValidation } from './cte/useCTeValidation';
import { DiagnosisSheet } from './cte/DiagnosisSheet';
import { StepImport, StepParts, StepRoute, StepFreight, StepReview } from './cte/CTeSteps';
import { CTeList } from './cte/CTeList';

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
  const [form, setForm] = useState<CTeForm>(INITIAL_FORM);

  const { validationByStep, allIssues } = useCTeValidation(form, selectedNFeId, step);

  const nfeOptions = useMemo(() =>
    nfes.filter((n) => n.status === 'authorized').map((n) => ({
      value: n.id,
      label: `NF-e ${n.number} - ${n.clientName}`,
      description: `Valor: ${formatBRL(n.total)}`,
      meta: n.issueDate,
    })), [nfes]);

  const handleImportNFe = (id: string) => {
    const nfe = nfes.find((n) => n.id === id);
    if (!nfe) return;
    setSelectedNFeId(id);
    setForm((prev) => ({
      ...prev,
      sender_name: 'NOSSA EMPRESA LTDA',
      sender_document: '00.111.222/0001-33',
      sender_uf: 'SP',
      recipient_name: nfe.clientName,
      recipient_document: nfe.clientDocument,
      recipient_uf: 'RJ',
      cargo_value: nfe.total,
      freight_value: nfe.total * 0.05,
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
    (acc, c) => ({ total: acc.total + Number(c.total), authorized: acc.authorized + (c.status === 'authorized' ? 1 : 0) }),
    { total: 0, authorized: 0 },
  );

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
                    <div className="bg-primary/10 p-2 rounded-lg text-primary"><Truck className="h-5 w-5" /></div>
                    Emissão de CT-e Rodoviário
                  </DialogTitle>
                  <DialogDescription>Conhecimento de Transporte Eletrônico guiado</DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                  <DiagnosisSheet
                    validationByStep={validationByStep}
                    totalIssues={allIssues.total}
                    diagnosisSearch={diagnosisSearch}
                    setDiagnosisSearch={setDiagnosisSearch}
                    setStep={setStep}
                  />
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
                    {step === 0 && <StepImport nfeOptions={nfeOptions} selectedNFeId={selectedNFeId} onImport={handleImportNFe} onSkip={() => setStep(1)} />}
                    {step === 1 && <StepParts form={form} setForm={setForm} />}
                    {step === 2 && <StepRoute form={form} setForm={setForm} />}
                    {step === 3 && <StepFreight form={form} setForm={setForm} />}
                    {step === 4 && <StepReview form={form} />}
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

      <CTeList
        ctes={ctes}
        isLoading={isLoading}
        onTransmit={(id) => transmit.mutate(id)}
        onCancel={(id, reason) => cancel.mutate({ id, reason })}
      />
    </PageContainer>
  );
}
