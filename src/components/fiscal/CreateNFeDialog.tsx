import { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle, AlertTriangle, ArrowLeft, ChevronRight, Receipt, Send,
} from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/ui/base/alert';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/commercial/useClients';
import { useProducts } from '@/hooks/inventory/useProducts';
import { useFiscalTaxRules } from '@/hooks/fiscal/useFiscalTaxRules';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { calculateTaxes } from '@/shared/utils/fiscalMotor';
import { FiscalStepper } from './FiscalStepper';
import type { SmartSelectOption } from './SmartSelect';

import { STEPS, type NFeItemForm } from './createNFe/types';
import { StepInfo } from './createNFe/StepInfo';
import { StepClient } from './createNFe/StepClient';
import { StepProducts } from './createNFe/StepProducts';
import { StepTaxes } from './createNFe/StepTaxes';
import { StepTransport } from './createNFe/StepTransport';
import { StepFinance } from './createNFe/StepFinance';
import { StepReview } from './createNFe/StepReview';
import { DiagnosticSheet } from './createNFe/DiagnosticSheet';

interface CreateNFeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    clientName: string;
    clientId?: string;
    clientDocument?: string;
    operationType: string;
    items: { productCode: string; productName: string; productId?: string; quantity: number; unitPrice: number; unit?: string; ncm?: string; cfop?: string; ibs?: number; cbs?: number; ipi?: number; pis?: number; cofins?: number }[];
    discount?: number;
    shipping?: number;
  }) => Promise<any>;
}

export function CreateNFeDialog({ open, onOpenChange, onCreate }: CreateNFeDialogProps) {
  const { currentCompany } = useEnterprise();

  // Cliente
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDocument, setClientDocument] = useState('');
  const [clientUF, setClientUF] = useState('');

  // Data
  const clientsQuery = useClients();
  const taxRulesQuery = useFiscalTaxRules('SP', clientUF || 'SP');
  const productsQuery = useProducts();
  const clients = useMemo(() => clientsQuery.data || [], [clientsQuery.data]);
  const products = useMemo(() => productsQuery.data || [], [productsQuery.data]);
  const taxRules = useMemo(() => taxRulesQuery.data || [], [taxRulesQuery.data]);

  // Wizard state
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — Dados
  const [operationType, setOperationType] = useState('saida');
  const [naturezaOp, setNaturezaOp] = useState('Venda de mercadoria');
  const [defaultCfop, setDefaultCfop] = useState('5102');

  // Step 2 — Itens
  const [items, setItems] = useState<NFeItemForm[]>([]);

  // Step 4 — Transporte
  const [carrierName, setCarrierName] = useState('');
  const [freightType, setFreightType] = useState('1');
  const [shipping, setShipping] = useState(0);
  const [volumeQty, setVolumeQty] = useState(1);

  // Step 5 — Financeiro
  const [paymentMethod, setPaymentMethod] = useState('99');
  const [installments, setInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);

  // Diagnóstico
  const [diagnosisFilter, setDiagnosisFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDiagnosisSearch(searchTerm), 400);
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
    const calcAll = () => {
      const updated = items.map((it) => {
        if (!it.cfop) return it;
        const calc = calculateTaxes(
          { price: it.unitPrice, quantity: it.quantity, ncm: it.ncm },
          'SP',
          clientUF || 'SP',
          taxRulesQuery.data || [],
          // @ts-expect-error tax_regime pode estar fora do enum em tenants legados
          currentCompany?.tax_regime || 'simples_nacional',
          'hybrid',
        );
        return {
          ...it,
          icms: calc.icms_value,
          pis: calc.pis_value,
          cofins: calc.cofins_value,
          ipi: calc.ipi_value,
          ibs: calc.ibs_value,
          cbs: calc.cbs_value,
        };
      });
      const changed = updated.some((u, i) => u.icms !== items[i]?.icms || u.ibs !== items[i]?.ibs);
      if (changed) setItems(updated);
    };
    if (items.length > 0) calcAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, items.map((i) => `${i.cfop}-${i.quantity}-${i.unitPrice}-${i.ncm}`).join('|'), clientUF, taxRules, currentCompany?.tax_regime]);

  // Options
  const clientOptions: SmartSelectOption[] = useMemo(
    () => clients.map((c) => ({
      value: c.id,
      label: c.name,
      description: c.document,
      meta: `${c.address_city || ''}/${c.address_state || ''}`,
    })),
    [clients],
  );

  const productOptions: SmartSelectOption[] = useMemo(
    () => products.map((p) => ({
      value: p.id,
      label: p.name,
      description: `Cód: ${p.code}`,
      meta: formatBRL(p.sale_price),
    })),
    [products],
  );

  // Handlers
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

  // Totais
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalIcms = items.reduce((s, i) => s + (i.icms || 0), 0);
  const totalPis = items.reduce((s, i) => s + (i.pis || 0), 0);
  const totalCofins = items.reduce((s, i) => s + (i.cofins || 0), 0);
  const totalIpi = items.reduce((s, i) => s + (i.ipi || 0), 0);
  const total = subtotal - discount + shipping;

  // Validação
  const validationByStep = useMemo(() => {
    const steps: Record<number, { errors: string[]; warnings: string[] }> = {};
    STEPS.forEach((_, i) => (steps[i] = { errors: [], warnings: [] }));

    if (!naturezaOp.trim()) steps[0].errors.push('Natureza da operação é obrigatória para a validade jurídica da NF-e.');
    if (!clientId) steps[1].errors.push('O destinatário é obrigatório. Selecione um cliente da base.');
    if (clientDocument && clientDocument.replace(/\D/g, '').length < 11) steps[1].errors.push('O documento do destinatário (CPF/CNPJ) parece estar incompleto.');
    if (!clientUF) steps[1].errors.push('UF do destinatário não identificada. Verifique o cadastro.');

    if (items.length === 0) steps[2].errors.push('A nota precisa conter pelo menos um item para ser emitida.');
    items.forEach((item, idx) => {
      if (!item.cfop) steps[2].errors.push(`Item ${idx + 1} (${item.productName}): O código CFOP é obrigatório.`);
      if (!item.ncm) steps[2].warnings.push(`Item ${idx + 1}: NCM não informado. Isso pode causar rejeição pela SEFAZ.`);
      if (item.quantity <= 0) steps[2].errors.push(`Item ${idx + 1}: A quantidade deve ser maior que zero.`);
      if (item.unitPrice <= 0) steps[2].errors.push(`Item ${idx + 1}: O valor unitário não pode ser zero.`);
    });

    const totalTax = totalIcms + totalIpi + totalPis + totalCofins;
    if (totalTax === 0 && subtotal > 0) steps[3].warnings.push('Atenção: O valor total de impostos está zerado. Verifique as regras.');

    if (!paymentMethod) steps[5].errors.push('Informe o meio de pagamento utilizado.');
    if (installments < 1) steps[5].errors.push('O número de parcelas deve ser pelo menos 1.');

    return steps;
  }, [naturezaOp, clientId, clientDocument, clientUF, items, paymentMethod, totalIcms, totalIpi, totalPis, totalCofins, subtotal, installments]);

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

  const hasFilteredErrors = useMemo(
    () => Object.values(validationByStep).some((data) => data.errors.some((err) => err.toLowerCase().includes(diagnosisSearch.toLowerCase()))),
    [validationByStep, diagnosisSearch],
  );
  const hasFilteredWarnings = useMemo(
    () => Object.values(validationByStep).some((data) => data.warnings.some((warn) => warn.toLowerCase().includes(diagnosisSearch.toLowerCase()))),
    [validationByStep, diagnosisSearch],
  );

  const currentStepValidation = validationByStep[step] || { errors: [], warnings: [] };
  const hasBlockingErrors = currentStepValidation.errors.length > 0;

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
        ipi: i.ipi,
        pis: i.pis,
        cofins: i.cofins,
        ibs: i.ibs,
        cbs: i.cbs,
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
              <DiagnosticSheet
                allIssues={allIssues}
                validationByStep={validationByStep}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                diagnosisFilter={diagnosisFilter}
                setDiagnosisFilter={setDiagnosisFilter}
                diagnosisSearch={diagnosisSearch}
                hasFilteredErrors={hasFilteredErrors}
                hasFilteredWarnings={hasFilteredWarnings}
                nothingFoundInView={nothingFoundInView}
                onStepClick={setStep}
              />
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
                <StepInfo
                  operationType={operationType} setOperationType={setOperationType}
                  naturezaOp={naturezaOp} setNaturezaOp={setNaturezaOp}
                  defaultCfop={defaultCfop} setDefaultCfop={setDefaultCfop}
                />
              )}
              {step === 1 && (
                <StepClient
                  clientOptions={clientOptions}
                  clientId={clientId}
                  clientName={clientName}
                  clientDocument={clientDocument}
                  clientUF={clientUF}
                  onSelectClient={handleSelectClient}
                />
              )}
              {step === 2 && (
                <StepProducts
                  items={items}
                  productOptions={productOptions}
                  onAddProduct={handleAddProduct}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                />
              )}
              {step === 3 && (
                <StepTaxes
                  items={items}
                  totalIcms={totalIcms}
                  totalIpi={totalIpi}
                  totalPis={totalPis}
                  totalCofins={totalCofins}
                  total={total}
                />
              )}
              {step === 4 && (
                <StepTransport
                  carrierName={carrierName} setCarrierName={setCarrierName}
                  freightType={freightType} setFreightType={setFreightType}
                  shipping={shipping} setShipping={setShipping}
                  volumeQty={volumeQty} setVolumeQty={setVolumeQty}
                />
              )}
              {step === 5 && (
                <StepFinance
                  paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                  installments={installments} setInstallments={setInstallments}
                  discount={discount} setDiscount={setDiscount}
                />
              )}
              {step === 6 && (
                <StepReview
                  naturezaOp={naturezaOp}
                  clientName={clientName}
                  clientDocument={clientDocument}
                  items={items}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                  totalIcms={totalIcms}
                  totalIpi={totalIpi}
                  totalPis={totalPis}
                  totalCofins={totalCofins}
                />
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
                  'px-8 h-11 gap-2 shadow-lg transition-all',
                  hasBlockingErrors ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/20',
                )}
              >
                Avançar <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || hasBlockingErrors}
                className={cn(
                  'px-10 h-11 gap-2 bg-success hover:bg-success/90 shadow-lg transition-all',
                  hasBlockingErrors ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-success/20',
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
