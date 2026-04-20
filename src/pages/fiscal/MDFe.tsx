import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Send, CheckSquare, Plus, MapPin, Truck, ClipboardCheck, ArrowLeft, ArrowRight, ScrollText } from 'lucide-react';
import { useMDFes, useCreateMDFe, useTransmitMDFe, useCloseMDFe } from '@/hooks/useMDFe';
import { format } from 'date-fns';
import { FiscalStepper } from '@/components/fiscal/FiscalStepper';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';

const STEPS = [
  { id: 'route', label: 'Rota', icon: MapPin },
  { id: 'vehicle', label: 'Veículo & Motorista', icon: Truck },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];

export default function MDFePage() {
  const { data: mdfes = [], isLoading } = useMDFes();
  const create = useCreateMDFe();
  const transmit = useTransmitMDFe();
  const close = useCloseMDFe();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    uf_origin: 'SP', uf_destination: 'RJ', loading_city: '',
    vehicle_plate: '', vehicle_uf: 'SP', driver_name: '', driver_cpf: '',
  });

  const handleCreate = async () => {
    await create.mutateAsync(form as any);
    setOpen(false);
    setStep(0);
  };

  return (
    <PageContainer>
      <PageHeader
        title="MDF-e — Manifesto Eletrônico de Documentos Fiscais"
        description="Agrupe NF-e/CT-e por viagem e encerre automaticamente"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(0); }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo MDF-e</Button></DialogTrigger>
            <DialogContent className="max-w-2xl p-0">
              <DialogHeader className="border-b px-6 pt-6 pb-4">
                <DialogTitle className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                  Emissão de MDF-e
                </DialogTitle>
                <DialogDescription>Fluxo guiado em 3 etapas</DialogDescription>
              </DialogHeader>

              <div className="px-6 pt-4">
                <FiscalStepper steps={STEPS} currentStep={step} onStepClick={setStep} />
              </div>

              <div className="px-6 py-4 min-h-[260px]">
                {step === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Rota da viagem</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>UF Origem</Label><Input value={form.uf_origin} onChange={(e) => setForm({ ...form, uf_origin: e.target.value.toUpperCase() })} maxLength={2} /></div>
                      <div><Label>UF Destino</Label><Input value={form.uf_destination} onChange={(e) => setForm({ ...form, uf_destination: e.target.value.toUpperCase() })} maxLength={2} /></div>
                      <div className="col-span-2"><Label>Cidade de Carregamento</Label><Input value={form.loading_city} onChange={(e) => setForm({ ...form, loading_city: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Veículo e motorista</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Placa do Veículo</Label><Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })} /></div>
                      <div><Label>UF do Veículo</Label><Input value={form.vehicle_uf} onChange={(e) => setForm({ ...form, vehicle_uf: e.target.value.toUpperCase() })} maxLength={2} /></div>
                      <div><Label>Motorista</Label><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></div>
                      <div><Label>CPF Motorista</Label><Input value={form.driver_cpf} onChange={(e) => setForm({ ...form, driver_cpf: e.target.value })} /></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><ClipboardCheck className="h-4 w-4" />Revisão</h3>
                    <Card className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Rota</span><span className="font-medium">{form.uf_origin} → {form.uf_destination}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Carregamento</span><span className="font-medium">{form.loading_city || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Veículo</span><span className="font-medium">{form.vehicle_plate || '—'} ({form.vehicle_uf})</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Motorista</span><span className="font-medium">{form.driver_name || '—'}</span></div>
                    </Card>
                    <p className="text-xs text-muted-foreground">
                      Após criar, vincule NF-e e CT-e ao manifesto para iniciar a viagem.
                    </p>
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
                    <Button onClick={handleCreate} disabled={create.isPending}><Send className="mr-2 h-4 w-4" />{create.isPending ? 'Criando...' : 'Criar MDF-e'}</Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total MDF-e</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{mdfes.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Em Trânsito</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-primary">{mdfes.filter(m => m.status === 'authorized').length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Encerrados</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-success">{mdfes.filter(m => m.status === 'closed').length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Manifestos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Carregando…</div> : mdfes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum MDF-e cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Número</TableHead><TableHead>Emissão</TableHead><TableHead>Rota</TableHead><TableHead>Veículo</TableHead><TableHead>Motorista</TableHead><TableHead className="text-right">Docs</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {mdfes.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.number}</TableCell>
                    <TableCell>{format(new Date(m.issue_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-sm">{m.uf_origin} → {m.uf_destination}</TableCell>
                    <TableCell>{m.vehicle_plate || '-'}</TableCell>
                    <TableCell>{m.driver_name || '-'}</TableCell>
                    <TableCell className="text-right">{m.total_documents}</TableCell>
                    <TableCell><FiscalStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      {m.status === 'draft' && <Button size="sm" variant="outline" onClick={() => transmit.mutate(m.id)}><Send className="h-3 w-3" /></Button>}
                      {m.status === 'authorized' && <Button size="sm" variant="outline" onClick={() => close.mutate(m.id)}><CheckSquare className="h-3 w-3 mr-1" />Encerrar</Button>}
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
