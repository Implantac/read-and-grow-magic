import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { Send, CheckSquare, Plus, MapPin, Truck, ClipboardCheck, ArrowLeft, ArrowRight, ScrollText, FileText, User, Trash2, ChevronRight, Info } from 'lucide-react';
import { useMDFes, useCreateMDFe, useTransmitMDFe, useCloseMDFe } from '@/hooks/fiscal/useMDFe';
import { useNFe } from '@/hooks/fiscal/useNFe';
import { useCTes } from '@/hooks/fiscal/useCTe';
import { format } from 'date-fns';
import { FiscalStepper } from '@/components/fiscal/FiscalStepper';
import { FiscalStatusBadge } from '@/components/fiscal/FiscalStatusBadge';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Separator } from '@/ui/base/separator';
import { Badge } from '@/ui/base/badge';
import { Checkbox } from '@/ui/base/checkbox';

import { formatBRL } from '@/lib/formatters';
const STEPS = [
  { id: 'docs', label: 'Documentos', icon: FileText },
  { id: 'route', label: 'Rota', icon: MapPin },
  { id: 'vehicle', label: 'Veículo', icon: Truck },
  { id: 'review', label: 'Revisão', icon: ClipboardCheck },
];

export default function MDFePage() {
  const { data: mdfes = [], isLoading } = useMDFes();
  const { nfes } = useNFe();
  const { data: ctes = [] } = useCTes();
  const create = useCreateMDFe();
  const transmit = useTransmitMDFe();
  const close = useCloseMDFe();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [form, setForm] = useState({
    uf_origin: 'SP', uf_destination: 'RJ', loading_city: 'SÃO PAULO',
    vehicle_plate: '', vehicle_uf: 'SP', driver_name: '', driver_cpf: '',
  });

  const availableDocs = useMemo(() => {
    const authorizedNFes = nfes.filter(n => n.status === 'authorized').map(n => ({ id: n.id, number: n.number, type: 'NF-e', client: n.clientName, value: n.total }));
    const authorizedCTes = ctes.filter(c => c.status === 'authorized').map(c => ({ id: c.id, number: c.number, type: 'CT-e', client: c.recipient_name, value: Number(c.freight_value) }));
    return [...authorizedNFes, ...authorizedCTes];
  }, [nfes, ctes]);

  const handleToggleDoc = (id: string) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    await create.mutateAsync({ ...form, documents: selectedDocs } as any);
    setOpen(false);
    setStep(0);
    setSelectedDocs([]);
  };

  return (
    <PageContainer>
      <PageHeader
        title="MDF-e — Manifesto Eletrônico de Documentos Fiscais"
        description="Agrupe NF-e/CT-e por viagem e encerre automaticamente"
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep(0); setSelectedDocs([]); } }}>
            <DialogTrigger asChild><Button className="shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" />Novo MDF-e</Button></DialogTrigger>
            <DialogContent className="max-w-4xl p-0 h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="border-b px-8 py-6 bg-muted/30">
                <div className="space-y-1">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <ScrollText className="h-5 w-5" />
                    </div>
                    Emissão de MDF-e
                  </DialogTitle>
                  <DialogDescription>Manifesto Eletrônico de Documentos Fiscais</DialogDescription>
                </div>
              </DialogHeader>

              <div className="px-10 py-6 border-b">
                <FiscalStepper steps={STEPS} currentStep={step} onStepClick={setStep} />
              </div>

              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                  <div className="px-8 py-6 max-w-3xl mx-auto">
                    {step === 0 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h3 className="text-lg font-bold">Selecionar Documentos</h3>
                          <Badge variant="outline" className="font-mono">{selectedDocs.length} DOCS</Badge>
                        </div>
                        <div className="rounded-2xl border overflow-hidden bg-background shadow-sm">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Número / Tipo</TableHead>
                                <TableHead>Destinatário</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {availableDocs.map(doc => (
                                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => handleToggleDoc(doc.id)}>
                                  <TableCell><Checkbox checked={selectedDocs.includes(doc.id)} /></TableCell>
                                  <TableCell>
                                    <div className="font-bold">{doc.number}</div>
                                    <Badge variant="secondary" className="text-[10px] h-4">{doc.type}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">{doc.client}</TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatBRL(doc.value)}</TableCell>
                                </TableRow>
                              ))}
                              {availableDocs.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground italic">
                                    Nenhuma NF-e ou CT-e autorizada disponível para vincular.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>UF de Origem (Carregamento)</Label>
                            <Input value={form.uf_origin} onChange={(e) => setForm({ ...form, uf_origin: e.target.value.toUpperCase() })} maxLength={2} className="font-bold h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label>UF de Destino (Descarregamento)</Label>
                            <Input value={form.uf_destination} onChange={(e) => setForm({ ...form, uf_destination: e.target.value.toUpperCase() })} maxLength={2} className="font-bold h-12" />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Cidade de Carregamento Principal</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input value={form.loading_city} onChange={(e) => setForm({ ...form, loading_city: e.target.value })} className="pl-10 h-12 font-bold" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Placa do Veículo (Tração)</Label>
                            <Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })} placeholder="ABC-1234" className="h-12 font-black uppercase tracking-widest text-lg" />
                          </div>
                          <div className="space-y-2">
                            <Label>UF do Veículo</Label>
                            <Input value={form.vehicle_uf} onChange={(e) => setForm({ ...form, vehicle_uf: e.target.value.toUpperCase() })} maxLength={2} className="h-12 font-bold" />
                          </div>
                          <div className="col-span-2 space-y-4 pt-4">
                            <Separator />
                            <div className="flex items-center gap-2 text-primary">
                              <User className="h-4 w-4" />
                              <h4 className="text-xs font-black uppercase tracking-widest">Motorista Condutor</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} className="h-11" />
                              </div>
                              <div className="space-y-2">
                                <Label>CPF</Label>
                                <Input value={form.driver_cpf} onChange={(e) => setForm({ ...form, driver_cpf: e.target.value })} className="h-11 font-mono" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="flex flex-col items-center gap-4 mb-8">
                          <div className="bg-success/10 p-4 rounded-full text-success">
                            <ClipboardCheck className="h-10 w-10" />
                          </div>
                          <h3 className="text-2xl font-bold">Resumo do Manifesto</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="shadow-sm">
                            <CardContent className="p-5 space-y-4">
                              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Logística e Rota</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Rota:</span><span className="font-bold">{form.uf_origin} → {form.uf_destination}</span></div>
                                <div className="flex justify-between"><span>Carregamento:</span><span className="font-bold">{form.loading_city}</span></div>
                                <div className="flex justify-between"><span>Veículo:</span><span className="font-bold">{form.vehicle_plate} ({form.vehicle_uf})</span></div>
                                <div className="flex justify-between"><span>Condutor:</span><span className="font-bold">{form.driver_name}</span></div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="border-primary bg-primary/5 shadow-lg">
                            <CardContent className="p-5 space-y-4">
                              <h4 className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">Documentos Vinculados</h4>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground uppercase font-bold">Total de Notas/CTes</span>
                                  <span className="text-2xl font-black text-primary">{selectedDocs.length}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                  <Info className="h-3 w-3" /> Após a emissão, os documentos serão vinculados juridicamente a esta viagem.
                                </p>
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
                    <Button onClick={() => setStep(step + 1)} className="px-8 h-11 shadow-lg shadow-primary/20 transition-all" disabled={step === 0 && selectedDocs.length === 0}>
                      Próximo <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleCreate} disabled={create.isPending} className="px-10 h-11 bg-success hover:bg-success/90 shadow-lg shadow-success/20 transition-all">
                      {create.isPending ? 'Processando...' : <><Send className="mr-2 h-4 w-4" /> Emitir MDF-e</>}
                    </Button>
                  )}
                </div>
              </DialogFooter>
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
