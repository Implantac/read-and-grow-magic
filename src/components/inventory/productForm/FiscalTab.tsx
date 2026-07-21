import { AlertCircle } from 'lucide-react';
import { TabsContent } from '@/ui/base/tabs';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import type { ProductForm, Update } from './formState';

interface Props {
  form: ProductForm;
  update: Update;
  isService: boolean;
  ncmError: string;
  gtinError: string;
}

export function FiscalTab({ form, update, isService, ncmError, gtinError }: Props) {
  return (
    <TabsContent value="fiscal" className="space-y-4 pt-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{isService ? 'Código LC 116' : 'NCM'}</Label>
          <Input
            value={isService ? form.service_code_lc116 : form.ncm}
            onChange={(e) => update(isService ? { service_code_lc116: e.target.value } : { ncm: e.target.value })}
            placeholder={isService ? '00.00' : '00000000'}
            aria-invalid={!isService && !!ncmError}
          />
          {!isService && ncmError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {ncmError}
            </p>
          )}
        </div>
        {!isService && (
          <>
            <div className="space-y-2"><Label>CEST</Label>
              <Input value={form.cest} onChange={(e) => update({ cest: e.target.value })} /></div>
            <div className="space-y-2"><Label>CFOP Padrão</Label>
              <Input value={form.cfop_default} onChange={(e) => update({ cfop_default: e.target.value })} placeholder="5102" /></div>
          </>
        )}
        <div className="space-y-2">
          <Label>GTIN</Label>
          <Input value={form.gtin} onChange={(e) => update({ gtin: e.target.value })} aria-invalid={!!gtinError} />
          {gtinError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {gtinError}
            </p>
          )}
        </div>
      </div>
      {!isService ? (
        <div className="grid grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Origem</Label>
            <Select value={form.origin} onValueChange={(v) => update({ origin: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 - Nacional</SelectItem>
                <SelectItem value="1">1 - Estrangeira (Import. direta)</SelectItem>
                <SelectItem value="2">2 - Estrangeira (Merc. interno)</SelectItem>
                <SelectItem value="3">3 - Nacional {'>'} 40% import.</SelectItem>
                <SelectItem value="6">6 - Nacional s/ similar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>CST ICMS</Label>
            <Input value={form.icms_cst} onChange={(e) => update({ icms_cst: e.target.value })} /></div>
          <div className="space-y-2"><Label>CST IPI</Label>
            <Input value={form.ipi_cst} onChange={(e) => update({ ipi_cst: e.target.value })} /></div>
          <div className="space-y-2"><Label>CST PIS</Label>
            <Input value={form.pis_cst} onChange={(e) => update({ pis_cst: e.target.value })} /></div>
          <div className="space-y-2"><Label>CST COFINS</Label>
            <Input value={form.cofins_cst} onChange={(e) => update({ cofins_cst: e.target.value })} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Alíquota ISS (%)</Label>
            <Input type="number" step="0.01" value={form.iss_rate}
              onChange={(e) => update({ iss_rate: e.target.value })} placeholder="Ex: 5" />
          </div>
        </div>
      )}
    </TabsContent>
  );
}
