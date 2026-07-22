import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/ui/base/alert';
import { StepInfo } from './StepInfo';
import { StepClient } from './StepClient';
import { StepProducts } from './StepProducts';
import { StepTaxes } from './StepTaxes';
import { StepTransport } from './StepTransport';
import { StepFinance } from './StepFinance';
import { StepReview } from './StepReview';

export function CreateNFeStepContent({ s, state }: { s: any; state: any }) {
  const cv = state.currentStepValidation;
  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6 space-y-3">
        {cv.errors.map((err: string, i: number) => (
          <Alert key={`err-${i}`} variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Inconsistência Fiscal</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ))}
        {cv.warnings.map((warn: string, i: number) => (
          <Alert key={`warn-${i}`} className="bg-amber-50 border-amber-200 text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Sugestão de Correção</AlertTitle>
            <AlertDescription>{warn}</AlertDescription>
          </Alert>
        ))}
      </div>

      {s === 0 && (
        <StepInfo
          operationType={state.operationType} setOperationType={state.setOperationType}
          naturezaOp={state.naturezaOp} setNaturezaOp={state.setNaturezaOp}
          defaultCfop={state.defaultCfop} setDefaultCfop={state.setDefaultCfop}
        />
      )}
      {s === 1 && (
        <StepClient
          clientOptions={state.clientOptions}
          clientId={state.clientId}
          clientName={state.clientName}
          clientDocument={state.clientDocument}
          clientUF={state.clientUF}
          onSelectClient={state.handleSelectClient}
        />
      )}
      {s === 2 && (
        <StepProducts
          items={state.items}
          productOptions={state.productOptions}
          onAddProduct={state.handleAddProduct}
          onUpdateItem={state.updateItem}
          onRemoveItem={state.removeItem}
        />
      )}
      {s === 3 && (
        <StepTaxes
          items={state.items}
          totalIcms={state.totalIcms}
          totalIpi={state.totalIpi}
          totalPis={state.totalPis}
          totalCofins={state.totalCofins}
          total={state.total}
        />
      )}
      {s === 4 && (
        <StepTransport
          carrierName={state.carrierName} setCarrierName={state.setCarrierName}
          freightType={state.freightType} setFreightType={state.setFreightType}
          shipping={state.shipping} setShipping={state.setShipping}
          volumeQty={state.volumeQty} setVolumeQty={state.setVolumeQty}
        />
      )}
      {s === 5 && (
        <StepFinance
          paymentMethod={state.paymentMethod} setPaymentMethod={state.setPaymentMethod}
          installments={state.installments} setInstallments={state.setInstallments}
          discount={state.discount} setDiscount={state.setDiscount}
        />
      )}
      {s === 6 && (
        <StepReview
          naturezaOp={state.naturezaOp}
          clientName={state.clientName}
          clientDocument={state.clientDocument}
          items={state.items}
          subtotal={state.subtotal}
          discount={state.discount}
          shipping={state.shipping}
          total={state.total}
          totalIcms={state.totalIcms}
          totalIpi={state.totalIpi}
          totalPis={state.totalPis}
          totalCofins={state.totalCofins}
        />
      )}
    </div>
  );
}
