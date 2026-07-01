import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { CheckCircle2, PlayCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Row {
  id: string; postmortem_id: string; postmortem_title: string;
  title: string; status: string; priority: string;
  owner_id: string | null; due_at: string | null; overdue: boolean;
}

export function SREActionsInboxCard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('sre_postmortem_actions_inbox', { _only_mine: true });
    if (!error) setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.rpc('sre_postmortem_action_set_status', { _id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    load();
  };

  if (!loading && rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-orange-500" /> Ações SRE atribuídas a mim
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-xs text-muted-foreground">Carregando…</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Postmortem</TableHead><TableHead>Ação</TableHead>
              <TableHead>Prior.</TableHead><TableHead>Prazo</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[220px] truncate">
                    <Link to="/sre/postmortems" className="hover:underline" title={r.postmortem_title}>{r.postmortem_title}</Link>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate" title={r.title}>{r.title}</TableCell>
                  <TableCell><Badge variant={r.priority === 'critical' ? 'destructive' : 'secondary'}>{r.priority}</Badge></TableCell>
                  <TableCell className={`text-xs ${r.overdue ? 'text-destructive font-semibold' : ''}`}>
                    {r.due_at ? new Date(r.due_at).toLocaleString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    {r.status === 'open' && (
                      <Button size="icon" variant="ghost" title="Iniciar" onClick={() => setStatus(r.id, 'in_progress')}><PlayCircle className="h-4 w-4" /></Button>
                    )}
                    <Button size="icon" variant="ghost" title="Concluir" onClick={() => setStatus(r.id, 'done')}><CheckCircle2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
