import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Separator } from '@/ui/base/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Button } from '@/ui/base/button';
import { SmartSelect } from '@/components/fiscal/SmartSelect';
import { FileText, Search, Receipt, Calculator, ClipboardCheck, ChevronRight } from 'lucide-react';
import { formatBRL } from '@/lib/formatters';
import { toSafeNumber } from '@/lib/numericValidation';
import type { CTeForm } from './constants';

interface CommonProps { form: CTeForm; setForm: (f: CTeForm) => void; }

export function StepImport({ nfeOptions, selectedNFeId, onImport, onSkip }: {
  nfeOptions: any[]; selectedNFeId: string; onImport: (id: string) => void; onSkip: () => void;
}) {
  return (
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
          <SmartSelect options={nfeOptions as any} value={selectedNFeId} onChange={onImport} placeholder="Pesquisar NF-e por número ou cliente..." />
        </div>
        <Button variant="ghost" onClick={onSkip} className="text-primary hover:bg-primary/5">
          Pular importação e preencher manualmente <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function StepParts({ form, setForm }: CommonProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Search className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-widest">Remetente (Quem envia)</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome/Razão Social</Label><Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>CNPJ/CPF</Label><Input value={form.sender_document} onChange={(e) => setForm({ ...form, sender_document: e.target.value })} /></div>
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Receipt className="h-4 w-4" />
            <h4 className="text-xs font-bold uppercase tracking-widest">Destinatário (Quem recebe)</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome/Razão Social</Label><Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>CNPJ/CPF</Label><Input value={form.recipient_document} onChange={(e) => setForm({ ...form, recipient_document: e.target.value })} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepRoute({ form, setForm }: CommonProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label>UF Origem</Label><Input value={form.sender_uf} onChange={(e) => setForm({ ...form, sender_uf: e.target.value.toUpperCase() })} maxLength={2} className="font-bold" /></div>
        <div className="space-y-2"><Label>UF Destino</Label><Input value={form.recipient_uf} onChange={(e) => setForm({ ...form, recipient_uf: e.target.value.toUpperCase() })} maxLength={2} className="font-bold" /></div>
        <div className="space-y-2"><Label>Cidade Origem</Label><Input value={form.origin_city} onChange={(e) => setForm({ ...form, origin_city: e.target.value })} /></div>
        <div className="space-y-2"><Label>Cidade Destino</Label><Input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} /></div>
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
  );
}

export function StepFreight({ form, setForm }: CommonProps) {
  return (
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
  );
}

export function StepReview({ form }: { form: CTeForm }) {
  return (
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
  );
}
