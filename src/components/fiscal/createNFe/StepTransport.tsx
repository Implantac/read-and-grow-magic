import { Scale, Truck } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toSafeNumber } from '@/lib/numericValidation';

interface Props {
  carrierName: string;
  setCarrierName: (v: string) => void;
  freightType: string;
  setFreightType: (v: string) => void;
  shipping: number;
  setShipping: (v: number) => void;
  volumeQty: number;
  setVolumeQty: (v: number) => void;
}

export function StepTransport({ carrierName, setCarrierName, freightType, setFreightType, shipping, setShipping, volumeQty, setVolumeQty }: Props) {
  return (
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
              <Input type="number" min={0} step={1} value={volumeQty} onChange={(e) => setVolumeQty(toSafeNumber(e.target.value, 0, { integer: true, min: 0 }))} />
            </div>
            <div className="space-y-2">
              <Label>Valor do Frete</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                <Input type="number" min={0} step="0.01" value={shipping} onChange={(e) => setShipping(toSafeNumber(e.target.value, 0, { maxDecimals: 2, min: 0 }))} className="pl-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
