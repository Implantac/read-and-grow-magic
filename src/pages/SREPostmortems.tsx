import { useEffect, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Skeleton } from '@/ui/base/skeleton';
import { FileText, Plus, CheckCircle2, Trash2, ListChecks, ChevronDown, ChevronRight, BellRing } from 'lucide-react';
import { PostmortemActions } from '@/components/sre/PostmortemActions';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { toast } from 'sonner';

interface Postmortem {
  id: string;
  title: string;
  severity: string;
  status: string;
  summary?: string;
  root_cause?: string;
  impact?: string;
  timeline?: string;
  action_items: any[];
  incident_id?: string | null;
  slo_id?: string | null;
  published_at?: string | null;
  created_at: string;
}

const SEV = { minor: 'secondary', major: 'default', critical: 'destructive' } as const;
const STATUS = { draft: 'outline', published: 'default', closed: 'secondary' } as const;

export default function SREPostmortems() {
  const companyId = useEnterpriseStore(s => s.activeCompanyId);
  const [list, setList] = useState<Postmortem[]>([]);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [slos, setSlos] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', summary: '', impact: '', root_cause: '', timeline: '',
    severity: 'major', incident_id: '', slo_id: '',
  });

  const load = async () => {
    setLoading(true);
    const [{ data: pms }, { data: inc }, { data: sl }] = await Promise.all([
      supabase.from('sre_postmortems').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('system_incidents').select('id,title,severity,opened_at').order('opened_at', { ascending: false }).limit(50),
      supabase.from('sre_slos').select('id,name,domain'),
    ]);
    setList((pms ?? []) as any); setIncidents(inc ?? []); setSlos(sl ?? []);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const create = async () => {
    if (!companyId || !form.title) { toast.error('Título é obrigatório'); return; }
    const { error } = await supabase.from('sre_postmortems').insert({
      company_id: companyId,
      title: form.title,
      summary: form.summary || null,
      impact: form.impact || null,
      root_cause: form.root_cause || null,
      timeline: form.timeline || null,
      severity: form.severity,
      incident_id: form.incident_id || null,
      slo_id: form.slo_id || null,
      action_items: [],
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Postmortem criado');
    setForm({ title: '', summary: '', impact: '', root_cause: '', timeline: '', severity: 'major', incident_id: '', slo_id: '' });
    load();
  };

  const publish = async (id: string) => {
    const { error } = await supabase.from('sre_postmortems')
      .update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Publicado'); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('sre_postmortems').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <PageContainer>
      <PageHeader title="Postmortems SRE" description="Registro estruturado de análise pós-incidente com raiz, impacto e ações" icon={FileText} actions={
        <Button variant="outline" size="sm" onClick={async () => {
          const { data, error } = await supabase.rpc('sre_actions_notify_due');
          if (error) { toast.error(error.message); return; }
          const n = (data as any)?.notifications_created ?? 0;
          toast.success(`Varredura executada · ${n} notificações criadas`);
        }}><BellRing className="h-4 w-4 mr-2" /> Verificar prazos agora</Button>
      } />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo postmortem</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Queda parcial do módulo Fiscal em 01/07" /></div>
          <div>
            <Label>Incidente relacionado</Label>
            <Select value={form.incident_id} onValueChange={(v) => setForm({ ...form, incident_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>{incidents.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>SLO impactado</Label>
            <Select value={form.slo_id} onValueChange={(v) => setForm({ ...form, slo_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>{slos.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.domain}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Severidade</Label>
            <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Resumo</Label><Textarea rows={2} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
          <div><Label>Impacto</Label><Textarea rows={3} value={form.impact} onChange={e => setForm({ ...form, impact: e.target.value })} /></div>
          <div><Label>Causa raiz</Label><Textarea rows={3} value={form.root_cause} onChange={e => setForm({ ...form, root_cause: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Timeline</Label><Textarea rows={3} value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} placeholder="10:12 - alerta disparou; 10:15 - on-call assumiu..." /></div>
          <div className="md:col-span-2"><Button onClick={create}><Plus className="h-4 w-4 mr-2" /> Registrar</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Postmortems recentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum postmortem registrado ainda.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Título</TableHead>
                <TableHead>Severidade</TableHead><TableHead>Status</TableHead>
                <TableHead>Ações</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {list.map(p => (
                  <>
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-xs">{new Date(p.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="max-w-[320px] truncate" title={p.title}>{p.title}</TableCell>
                    <TableCell><Badge variant={SEV[p.severity as keyof typeof SEV] ?? 'secondary'}>{p.severity}</Badge></TableCell>
                    <TableCell><Badge variant={STATUS[p.status as keyof typeof STATUS] ?? 'outline'}>{p.status}</Badge></TableCell>
                    <TableCell className="text-center">{p.action_items?.length ?? 0}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" title="Action items" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                        {expanded === p.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      {p.status === 'draft' && (
                        <Button size="icon" variant="ghost" onClick={() => publish(p.id)} title="Publicar"><CheckCircle2 className="h-4 w-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                  {expanded === p.id && (
                    <TableRow key={p.id + '-actions'}>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <div className="p-2">
                          <div className="flex items-center gap-2 mb-3 text-sm font-medium"><ListChecks className="h-4 w-4" /> Action items</div>
                          <PostmortemActions postmortemId={p.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
