import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/base/button';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { toast } from 'sonner';
import { Workflow, Plus } from 'lucide-react';

type Row = { id: string; name: string; description: string; status: string; trigger: any; nodes: any[]; edges: any[]; updated_at: string };

export default function Workflows() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState('');

  async function load() {
    const { data, error } = await supabase.from('cx_workflows')
      .select('id, name, description, status, trigger, nodes, edges, updated_at')
      .order('updated_at', { ascending: false });
    if (error) toast.error(error.message); else setRows((data as any) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', u.user!.id).maybeSingle();
    if (!prof?.company_id) return toast.error('Sem empresa');
    const { error } = await supabase.from('cx_workflows').insert({
      company_id: prof.company_id, name, trigger: { type: 'nps_answer' }, nodes: [], edges: [], status: 'draft',
    });
    if (error) toast.error(error.message); else { setName(''); toast.success('Workflow criado'); load(); }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Workflow className="h-5 w-5" /> Workflow Builder</h2>
      <p className="text-sm text-muted-foreground">Fluxos no-code (gatilho → condição → ação). Editor visual em breve; hoje suporta CRUD.</p>

      <Card className="p-3 flex gap-2">
        <Input placeholder="Nome do workflow (ex.: Detrator → Ticket + WhatsApp)" value={name} onChange={e => setName(e.target.value)} />
        <Button onClick={create}><Plus className="h-4 w-4 mr-1" /> Criar</Button>
      </Card>

      <div className="grid gap-2">
        {rows.length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhum workflow ainda.</Card>}
        {rows.map(r => (
          <Card key={r.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-muted-foreground">Gatilho: {r.trigger?.type ?? '—'} • Nós: {r.nodes?.length ?? 0}</div>
            </div>
            <Badge>{r.status}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
