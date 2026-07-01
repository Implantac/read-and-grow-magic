import { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Textarea } from '@/ui/base/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { BookOpen, CalendarClock, Plus, Trash2, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { toast } from 'sonner';

interface Shift {
  id: string; company_id: string; domain: string; user_id: string;
  starts_at: string; ends_at: string; notes: string | null;
}
interface Runbook {
  id: string; company_id: string; title: string; domain: string | null;
  slo_id: string | null; severity: string; steps_md: string; updated_at: string;
}

export default function SREOncall() {
  const companyId = useEnterpriseStore(s => s.activeCompanyId);
  const [tab, setTab] = useState('oncall');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [loading, setLoading] = useState(true);

  // shift form
  const [sDomain, setSDomain] = useState('');
  const [sUser, setSUser] = useState('');
  const [sStart, setSStart] = useState('');
  const [sEnd, setSEnd] = useState('');
  const [sNotes, setSNotes] = useState('');

  // runbook form
  const [rTitle, setRTitle] = useState('');
  const [rDomain, setRDomain] = useState('');
  const [rSev, setRSev] = useState('warning');
  const [rSteps, setRSteps] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: r }] = await Promise.all([
      supabase.from('sre_oncall_shifts').select('*').order('starts_at', { ascending: false }),
      supabase.from('sre_runbooks').select('*').order('updated_at', { ascending: false }),
    ]);
    setShifts((s ?? []) as Shift[]);
    setRunbooks((r ?? []) as Runbook[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const now = Date.now();
  const active = useMemo(() => shifts.filter(x => new Date(x.starts_at).getTime() <= now && new Date(x.ends_at).getTime() >= now), [shifts, now]);
  const upcoming = useMemo(() => shifts.filter(x => new Date(x.starts_at).getTime() > now).length, [shifts, now]);

  const createShift = async () => {
    if (!companyId || !sDomain || !sUser || !sStart || !sEnd) { toast.error('Preencha domínio, usuário e janela'); return; }
    const { error } = await supabase.from('sre_oncall_shifts').insert({
      company_id: companyId, domain: sDomain, user_id: sUser,
      starts_at: sStart, ends_at: sEnd, notes: sNotes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Turno criado'); setSDomain(''); setSUser(''); setSStart(''); setSEnd(''); setSNotes(''); load();
  };

  const createRunbook = async () => {
    if (!companyId || !rTitle || !rSteps) { toast.error('Título e passos são obrigatórios'); return; }
    const { error } = await supabase.from('sre_runbooks').insert({
      company_id: companyId, title: rTitle, domain: rDomain || null,
      severity: rSev, steps_md: rSteps,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Runbook criado'); setRTitle(''); setRDomain(''); setRSteps(''); load();
  };

  const removeShift = async (id: string) => {
    const { error } = await supabase.from('sre_oncall_shifts').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Turno removido'); load();
  };
  const removeRunbook = async (id: string) => {
    const { error } = await supabase.from('sre_runbooks').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Runbook removido'); load();
  };

  return (
    <PageContainer>
      <PageHeader title="On-call & Runbooks" description="Rotação de plantão SRE e procedimentos por domínio/SLO" />

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard title="Plantão ativo" value={active.length} icon={UserRound} index={0} />
        <KPICard title="Turnos futuros" value={upcoming} icon={CalendarClock} index={1} />
        <KPICard title="Runbooks" value={runbooks.length} icon={BookOpen} index={2} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="oncall">Rotação de plantão</TabsTrigger>
          <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="oncall" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo turno</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-6 items-end">
              <div><Label>Domínio</Label><Input value={sDomain} onChange={e => setSDomain(e.target.value)} placeholder="fiscal" /></div>
              <div className="md:col-span-2"><Label>User ID</Label><Input value={sUser} onChange={e => setSUser(e.target.value)} placeholder="uuid do usuário" /></div>
              <div><Label>Início</Label><Input type="datetime-local" value={sStart} onChange={e => setSStart(e.target.value)} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={sEnd} onChange={e => setSEnd(e.target.value)} /></div>
              <Button onClick={createShift}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
              <div className="md:col-span-6"><Label>Notas</Label><Input value={sNotes} onChange={e => setSNotes(e.target.value)} placeholder="Contexto, escalação, contato secundário…" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Turnos</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : shifts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum turno cadastrado.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Domínio</TableHead><TableHead>Usuário</TableHead>
                    <TableHead>Início</TableHead><TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
                  <TableBody>
                    {shifts.map(s => {
                      const start = new Date(s.starts_at).getTime();
                      const end = new Date(s.ends_at).getTime();
                      const status = start <= now && end >= now ? 'Ativo' : start > now ? 'Futuro' : 'Encerrado';
                      const variant = status === 'Ativo' ? 'default' : status === 'Futuro' ? 'secondary' : 'outline';
                      return (
                        <TableRow key={s.id}>
                          <TableCell><Badge variant="outline">{s.domain}</Badge></TableCell>
                          <TableCell className="font-mono text-xs">{s.user_id.slice(0, 8)}…</TableCell>
                          <TableCell>{new Date(s.starts_at).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{new Date(s.ends_at).toLocaleString('pt-BR')}</TableCell>
                          <TableCell><Badge variant={variant as any}>{status}</Badge></TableCell>
                          <TableCell><Button size="icon" variant="ghost" onClick={() => removeShift(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runbooks" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo runbook</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-6 items-end">
              <div className="md:col-span-2"><Label>Título</Label><Input value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="Fiscal — falha de transmissão Reinf" /></div>
              <div><Label>Domínio (opcional)</Label><Input value={rDomain} onChange={e => setRDomain(e.target.value)} placeholder="fiscal" /></div>
              <div><Label>Severidade</Label><Input value={rSev} onChange={e => setRSev(e.target.value)} placeholder="warning|critical" /></div>
              <Button onClick={createRunbook} className="md:col-span-2"><Plus className="h-4 w-4 mr-2" /> Publicar</Button>
              <div className="md:col-span-6"><Label>Passos (Markdown)</Label>
                <Textarea rows={6} value={rSteps} onChange={e => setRSteps(e.target.value)} placeholder={"1. Verificar certificado A1\n2. Consultar logs de reinf-transmit\n3. Escalar para on-call fiscal"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Runbooks publicados</CardTitle></CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-40 w-full" /> : runbooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum runbook publicado.</p>
              ) : (
                <div className="space-y-3">
                  {runbooks.map(r => (
                    <div key={r.id} className="border border-border/60 rounded-lg p-4 bg-card/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{r.title}</div>
                          <div className="flex gap-2 mt-1">
                            {r.domain && <Badge variant="outline">{r.domain}</Badge>}
                            <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'}>{r.severity}</Badge>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeRunbook(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <pre className="text-xs mt-3 whitespace-pre-wrap font-mono text-muted-foreground">{r.steps_md}</pre>
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
