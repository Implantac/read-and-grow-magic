import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useCollectionActions, useCreateCollectionAction } from '@/hooks/financial/useCreditAnalysis';
import { useClients } from '@/hooks/commercial/useClients';
import { useAccountsReceivable } from '@/hooks/financial/useAccountsReceivable';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Textarea } from '@/ui/base/textarea';
import { Phone, Plus, Search, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';

import { formatBRL, formatDate } from '@/lib/formatters';
const actionLabels: Record<string, string> = {
  contact: 'Contato', promise: 'Promessa', renegotiation: 'Renegociação', agreement: 'Acordo', note: 'Observação', follow_up: 'Follow-up',
};

export default function Collections() {
  const { data: actions = [], isLoading } = useCollectionActions();
  const { data: clients = [] } = useClients();
  const { data: receivables = [] } = useAccountsReceivable();
  const create = useCreateCollectionAction();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const overdueReceivables = receivables.filter((r: any) => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < new Date()));
  const totalOverdue = overdueReceivables.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const openActions = actions.filter(a => a.status === 'open');
  const brokenPromises = actions.filter(a => a.action_type === 'promise' && a.promise_status === 'broken');

  const fmt = (v: number) => formatBRL(v);

  const filtered = actions.filter(a => {
    const client = clientMap[a.client_id];
    return !search || (client?.name || '').toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
  });

  const openNew = () => {
    setForm({ client_id: '', action_type: 'contact', description: '', contact_method: 'phone', responsible: '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    create.mutate(form, { onSuccess: () => setDialogOpen(false) });
  };

  // Aging calculation
  const aging = { upcoming: 0, d1_7: 0, d8_15: 0, d16_30: 0, d31_60: 0, d60plus: 0 };
  const now = new Date();
  overdueReceivables.forEach((r: any) => {
    const diff = Math.floor((now.getTime() - new Date(r.due_date).getTime()) / 86400000);
    if (diff <= 0) aging.upcoming += Number(r.amount);
    else if (diff <= 7) aging.d1_7 += Number(r.amount);
    else if (diff <= 15) aging.d8_15 += Number(r.amount);
    else if (diff <= 30) aging.d16_30 += Number(r.amount);
    else if (diff <= 60) aging.d31_60 += Number(r.amount);
    else aging.d60plus += Number(r.amount);
  });

  return (
    <PageContainer>
      <PageHeader title="Cobrança" description="Acompanhamento de inadimplência e ações de cobrança" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Vencido" value={formatBRL(totalOverdue)} icon={<DollarSign className="h-5 w-5" />} accentColor="danger" index={0} />
        <KPICard title="Títulos Vencidos" value={String(overdueReceivables.length)} icon={<AlertCircle className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Ações em Aberto" value={String(openActions.length)} icon={<Clock className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Promessas Quebradas" value={String(brokenPromises.length)} icon={<Phone className="h-5 w-5" />} accentColor="danger" index={3} />
      </div>

      {/* Aging */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Aging List</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: 'A Vencer', value: aging.upcoming, color: 'text-emerald-600' },
              { label: '1-7 dias', value: aging.d1_7, color: 'text-amber-600' },
              { label: '8-15 dias', value: aging.d8_15, color: 'text-orange-600' },
              { label: '16-30 dias', value: aging.d16_30, color: 'text-orange-700' },
              { label: '31-60 dias', value: aging.d31_60, color: 'text-red-600' },
              { label: '>60 dias', value: aging.d60plus, color: 'text-destructive' },
            ].map(a => (
              <div key={a.label} className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">{a.label}</p>
                <p className={`text-sm font-bold ${a.color}`}>{formatBRL(a.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ações de Cobrança</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-64" />
              </div>
              <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nova Ação</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Próxima Ação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="p-0"><EmptyState icon={Phone} title="Nenhuma ação de cobrança" description="Registre contatos, promessas e acordos com clientes inadimplentes." /></TableCell></TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{clientMap[a.client_id]?.name || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{actionLabels[a.action_type] || a.action_type}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{a.description}</TableCell>
                  <TableCell>{a.responsible || '—'}</TableCell>
                  <TableCell className="text-xs">{a.next_action_date ? formatDate(a.next_action_date) : '—'}</TableCell>
                  <TableCell><Badge variant={a.status === 'open' ? 'default' : 'secondary'}>{a.status === 'open' ? 'Aberta' : 'Concluída'}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(a.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Ação de Cobrança</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Cliente</Label>
              <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.action_type} onValueChange={v => setForm({ ...form, action_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contato</SelectItem>
                    <SelectItem value="promise">Promessa</SelectItem>
                    <SelectItem value="renegotiation">Renegociação</SelectItem>
                    <SelectItem value="agreement">Acordo</SelectItem>
                    <SelectItem value="note">Observação</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Responsável</Label>
                <Input value={form.responsible || ''} onChange={e => setForm({ ...form, responsible: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={create.isPending || !form.client_id || !form.description}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
