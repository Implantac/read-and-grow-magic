import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Calendar } from 'lucide-react';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { Badge } from '@/ui/base/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import {
  useHealthPatients, useHealthAppointments,
  useHealthRecords, useCreateHealthRecord,
} from '@/hooks/useHealth';

export default function HealthPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: patients = [] } = useHealthPatients();
  const patient = patients.find(p => p.id === id);
  const { data: appts = [] } = useHealthAppointments(id);
  const { data: records = [] } = useHealthRecords(id);
  const createRec = useCreateHealthRecord();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ complaint: '', diagnosis: '', prescription: '', notes: '' });

  const submit = async () => {
    if (!id) return;
    await createRec.mutateAsync({
      patient_id: id,
      complaint: form.complaint || null,
      diagnosis: form.diagnosis || null,
      prescription: form.prescription || null,
      notes: form.notes || null,
    });
    setForm({ complaint: '', diagnosis: '', prescription: '', notes: '' });
    setOpen(false);
  };

  if (!patient) {
    return (
      <PageContainer>
        <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/saude/pacientes"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button>
        <Card><CardContent className="p-12 text-center text-muted-foreground">Paciente não encontrado.</CardContent></Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="mb-2"><Link to="/saude/pacientes"><ArrowLeft className="h-4 w-4 mr-2" />Pacientes</Link></Button>
      <PageHeader title={patient.full_name} description={patient.cpf ? `CPF ${patient.cpf}` : 'Prontuário do paciente'} icon={FileText} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nascimento</CardTitle></CardHeader><CardContent><p className="text-lg font-semibold">{patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : '—'}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Consultas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{appts.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Registros clínicos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{records.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Prontuário</TabsTrigger>
          <TabsTrigger value="appointments">Consultas</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Histórico clínico</CardTitle>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Novo registro</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo registro clínico</DialogTitle></DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div><Label>Queixa principal</Label><Textarea value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} /></div>
                    <div><Label>Diagnóstico</Label><Textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} /></div>
                    <div><Label>Prescrição</Label><Textarea value={form.prescription} onChange={e => setForm({ ...form, prescription: e.target.value })} /></div>
                    <div><Label>Anotações</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={submit} disabled={createRec.isPending}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhum registro ainda.</div>
              ) : (
                <div className="space-y-3">
                  {records.map(r => (
                    <Card key={r.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4 space-y-2">
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</div>
                        {r.complaint && <div><span className="text-xs font-semibold text-muted-foreground">QUEIXA:</span> <p className="text-sm">{r.complaint}</p></div>}
                        {r.diagnosis && <div><span className="text-xs font-semibold text-muted-foreground">DIAGNÓSTICO:</span> <p className="text-sm">{r.diagnosis}</p></div>}
                        {r.prescription && <div><span className="text-xs font-semibold text-muted-foreground">PRESCRIÇÃO:</span> <p className="text-sm whitespace-pre-wrap">{r.prescription}</p></div>}
                        {r.notes && <div><span className="text-xs font-semibold text-muted-foreground">ANOTAÇÕES:</span> <p className="text-sm">{r.notes}</p></div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader><CardTitle className="text-base">Consultas do paciente</CardTitle></CardHeader>
            <CardContent>
              {appts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />Sem consultas.</div>
              ) : (
                <div className="space-y-2">
                  {appts.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{new Date(a.scheduled_at).toLocaleString('pt-BR')}</div>
                        {a.reason && <div className="text-sm text-muted-foreground">{a.reason}</div>}
                      </div>
                      <Badge variant="secondary">{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
