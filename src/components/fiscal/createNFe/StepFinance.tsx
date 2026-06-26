import { CreditCard } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toSafeNumber } from '@/lib/numericValidation';

interface Props {
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  installments: number;
  setInstallments: (v: number) => void;
  discount: number;
  setDiscount: (v: number) => void;
}

export function StepFinance({ paymentMethod, setPaymentMethod, installments, setInstallments, discount, setDiscount }: Props) {
  return (
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
              <Input type="number" min={1} step={1} value={installments} onChange={(e) => setInstallments(toSafeNumber(e.target.value, 1, { integer: true, min: 1, max: 36 }))} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>Desconto Total</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(toSafeNumber(e.target.value, 0, { maxDecimals: 2, min: 0 }))} className="h-12 pl-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
