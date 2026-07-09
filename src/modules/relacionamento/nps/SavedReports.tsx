import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Textarea } from '@/ui/base/textarea';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Badge } from '@/ui/base/badge';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function SavedReports() {
  const { currentCompany } = useEnterprise() as any;
  const companyId = currentCompany?.id as string | undefined;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['nps', 'reports', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_reports').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_reports').update(input).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_reports').insert({ ...input, company_id: companyId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps', 'reports'] }); setOpen(false); setEditing(null); toast.success('Relatório salvo'); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps', 'reports'] }); toast.success('Removido'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-lg font-semibold">Relatórios salvos</h2>
          <p className="text-sm text-muted-foreground">Configurações reutilizáveis (dimensão, período, filtros).</p>
        </div>
        <Button onClick={() => { setEditing({ name: '', group_by: 'month', period: '180d', description: '' }); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo relatório
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {reports.map((r: any) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  {r.name}
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">Agrupar: {r.group_by ?? 'month'}</Badge>
                  <Badge variant="outline">Período: {r.period ?? '180d'}</Badge>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/relacionamento/nps/relatorios">Abrir no visualizador</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum relatório salvo. Crie um para reutilizar configurações.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar relatório' : 'Novo relatório'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea rows={2} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Agrupar por</Label>
                  <Select value={editing.group_by ?? 'month'} onValueChange={(v) => setEditing({ ...editing, group_by: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="city">Cidade</SelectItem>
                      <SelectItem value="segment">Segmento</SelectItem>
                      <SelectItem value="category">Categoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Período</Label>
                  <Select value={editing.period ?? '180d'} onValueChange={(v) => setEditing({ ...editing, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">30 dias</SelectItem>
                      <SelectItem value="90d">90 dias</SelectItem>
                      <SelectItem value="180d">6 meses</SelectItem>
                      <SelectItem value="365d">1 ano</SelectItem>
                      <SelectItem value="all">Todo o histórico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate(editing)} disabled={!editing?.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
