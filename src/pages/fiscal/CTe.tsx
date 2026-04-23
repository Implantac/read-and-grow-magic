import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Ban, Plus, Truck, MapPin, DollarSign, ClipboardCheck, ArrowLeft, ArrowRight, FileText, Search, Sparkles, Receipt } from 'lucide-react';
import { useCTes, useCreateCTe, useTransmitCTe, useCancelCTe } from '@/hooks/useCTe';
import { useNFe } from '@/hooks/useNFe';
import { format } from 'date-fns';
import { FiscalStepper } from '@/components/fiscal/FiscalStepper';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SmartSelect } from '@/components/fiscal/SmartSelect';

const STEPS = [
  { id: 'import', label: 'Importar NF-e', icon: FileText },
  { id: 'parts', label: 'Participantes', icon: Truck },
  { id: 'route', label: 'Rota', icon: MapPin },
  { id: 'freight', label: 'Valores', icon: DollarSign },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function CTePage() {
  const { data: ctes = [], isLoading } = useCTes();
  const { nfes } = useNFe();
  const createCTe = useCreateCTe();
  const transmit = useTransmitCTe();
  const cancel = useCancelCTe();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedNFeId, setSelectedNFeId] = useState('');
  const [form, setForm] = useState({
    carrier_name: 'TRANSPORTADORA LOGISTICA LTDA', carrier_document: '12.345.678/0001-90',
    sender_name: '', sender_document: '', sender_uf: 'SP',
    recipient_name: '', recipient_document: '', recipient_uf: 'RJ',
    origin_city: '', destination_city: '',
    cargo_value: 0, freight_value: 0, icms_rate: 12, modal: 'rodoviario',
  });

  const nfeOptions = useMemo(() => 
    nfes.filter(n => n.status === 'authorized').map(n => ({
      value: n.id,
      label: `NF-e ${n.number} - ${n.clientName}`,
      description: `Valor: ${fmt(n.total)}`,
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
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(0); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo CT-e</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0">
              <DialogHeader className="border-b px-6 pt-6 pb-4">
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Emissão de CT-e
                </DialogTitle>
                <DialogDescription>Fluxo guiado em 4 etapas</DialogDescription>
              </DialogHeader>

              <div className="px-6 pt-4">
                <FiscalStepper steps={STEPS} currentStep={step} onStepClick={setStep} />
              </div>

              <div className="px-6 py-4 min-h-[280px]">
                {step === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Transportadora e participantes</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Transportadora</Label><Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /></div>
                      <div><Label>CNPJ Transportadora</Label><Input value={form.carrier_document} onChange={(e) => setForm({ ...form, carrier_document: e.target.value })} /></div>
                      <div><Label>Remetente</Label><Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} /></div>
                      <div><Label>CNPJ Remetente</Label><Input value={form.sender_document} onChange={(e) => setForm({ ...form, sender_document: e.target.value })} /></div>
                      <div><Label>Destinatário</Label><Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
                      <div><Label>CNPJ Destinatário</Label><Input value={form.recipient_document} onChange={(e) => setForm({ ...form, recipient_document: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Rota e modalidade</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>UF Origem</Label><Input value={form.sender_uf} onChange={(e) => setForm({ ...form, sender_uf: e.target.value.toUpperCase() })} maxLength={2} /></div>
                      <div><Label>UF Destino</Label><Input value={form.recipient_uf} onChange={(e) => setForm({ ...form, recipient_uf: e.target.value.toUpperCase() })} maxLength={2} /></div>
                      <div><Label>Cidade Origem</Label><Input value={form.origin_city} onChange={(e) => setForm({ ...form, origin_city: e.target.value })} /></div>
                      <div><Label>Cidade Destino</Label><Input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} /></div>
                      <div className="col-span-2">
                        <Label>Modal</Label>
                        <Select value={form.modal} onValueChange={(v) => setForm({ ...form, modal: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rodoviario">Rodoviário</SelectItem>
                            <SelectItem value="aereo">Aéreo</SelectItem>
                            <SelectItem value="ferroviario">Ferroviário</SelectItem>
                            <SelectItem value="aquaviario">Aquaviário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Carga e frete</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Valor da carga (R$)</Label><Input type="number" value={form.cargo_value} onChange={(e) => setForm({ ...form, cargo_value: Number(e.target.value) })} /></div>
                      <div><Label>Valor do frete (R$)</Label><Input type="number" value={form.freight_value} onChange={(e) => setForm({ ...form, freight_value: Number(e.target.value) })} /></div>
                      <div><Label>Alíquota ICMS (%)</Label><Input type="number" value={form.icms_rate} onChange={(e) => setForm({ ...form, icms_rate: Number(e.target.value) })} /></div>
                      <div className="rounded-md border bg-primary/5 p-3">
                        <div className="text-xs text-muted-foreground">ICMS calculado</div>
                        <div className="text-lg font-bold text-primary">{fmt(icmsValue)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><ClipboardCheck className="h-4 w-4" />Revisão</h3>
                    <Card className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Transportadora</span><span className="font-medium">{form.carrier_name || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Rota</span><span className="font-medium">{form.origin_city}/{form.sender_uf} → {form.destination_city}/{form.recipient_uf}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Modal</span><span className="font-medium capitalize">{form.modal}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Carga</span><span className="font-medium">{fmt(form.cargo_value)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="font-medium">{fmt(form.freight_value)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">ICMS ({form.icms_rate}%)</span><span className="font-medium">{fmt(icmsValue)}</span></div>
                    </Card>
                  </div>
                )}
              </div>

              <div className="border-t bg-muted/20 px-6 py-3 flex items-center justify-between">
                <Button variant="ghost" onClick={() => { setOpen(false); setStep(0); }}>Cancelar</Button>
                <div className="flex gap-2">
                  {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Button>}
                  {step < STEPS.length - 1 ? (
                    <Button onClick={() => setStep(step + 1)}>Avançar<ArrowRight className="ml-1 h-4 w-4" /></Button>
                  ) : (
                    <Button onClick={handleCreate} disabled={createCTe.isPending}><Send className="mr-2 h-4 w-4" />{createCTe.isPending ? 'Criando...' : 'Emitir CT-e'}</Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total CT-e</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{ctes.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Autorizados</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-success">{totals.authorized}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Valor Total Frete</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{fmt(totals.total)}</CardContent></Card>
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
                    <TableCell className="text-right tabular-nums">{fmt(Number(c.freight_value))}</TableCell>
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
