import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useCredit } from '@/hooks/financial/useCreditQuery';
import { useClients } from '@/hooks/commercial/useClients';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Textarea } from '@/ui/base/textarea';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Search, Plus } from 'lucide-react';

import { formatBRL, formatDate } from '@/lib/formatters';
const riskColors: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  blocked: 'bg-destructive/10 text-destructive border-destructive/20',
};
const riskLabels: Record<string, string> = { low: 'Baixo', medium: 'Médio', high: 'Alto', blocked: 'Bloqueado' };
const statusLabels: Record<string, string> = { approved: 'Aprovado', analysis: 'Em Análise', restricted: 'Restrito', blocked: 'Bloqueado' };

export default function CreditAnalysis() {
  const { analyses: profiles = [], analysesLoading: isLoading, updateAnalysis } = useCredit();
  const { data: clients = [] } = useClients();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const filtered = profiles.filter(p => {
    const client = clientMap[p.client_id];
    if (!client) return false;
    return client.name.toLowerCase().includes(search.toLowerCase()) || client.code.toLowerCase().includes(search.toLowerCase());
  });

  const totalLimit = profiles.reduce((s, p) => s + Number(p.credit_limit), 0);
  const totalUsed = profiles.reduce((s, p) => s + Number(p.used_limit), 0);
  const blockedCount = profiles.filter(p => p.credit_status === 'blocked').length;
  const highRiskCount = profiles.filter(p => p.risk_classification === 'high' || p.risk_classification === 'blocked').length;

  const openNew = () => {
    setForm({ client_id: '', credit_limit: 0, risk_classification: 'medium', credit_status: 'analysis', score_numeric: 50, analysis_notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setForm({ ...p });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const { id, available_limit, score_grade, created_at, ...rest } = form;
    updateAnalysis({ id, updates: { ...rest, last_analysis_date: new Date().toISOString(), updated_at: new Date().toISOString() } }).then(() => setDialogOpen(false));
  };

  const fmt = (v: number) => formatBRL(v);

  return (
    <PageContainer>
      <PageHeader title="Análise de Crédito" description="Gestão de limites, scores e risco comercial" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Limite Total" value={formatBRL(totalLimit)} icon={<Shield className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Limite Utilizado" value={formatBRL(totalUsed)} icon={<ShieldAlert className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Clientes Bloqueados" value={String(blockedCount)} icon={<ShieldX className="h-5 w-5" />} accentColor="danger" index={2} />
        <KPICard title="Alto Risco" value={String(highRiskCount)} icon={<ShieldCheck className="h-5 w-5" />} accentColor="warning" index={3} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Perfis de Crédito</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-64" />
              </div>
              <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Nova Análise</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Utilizado</TableHead>
                <TableHead>Disponível</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Análise</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum perfil encontrado</TableCell></TableRow>
              ) : filtered.map(p => {
                const client = clientMap[p.client_id];
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(p)}>
                    <TableCell className="font-medium">{client?.name || '—'}</TableCell>
                    <TableCell>{formatBRL(p.credit_limit)}</TableCell>
                    <TableCell>{formatBRL(p.used_limit)}</TableCell>
                    <TableCell className={p.available_limit < 0 ? 'text-destructive font-semibold' : ''}>{formatBRL(p.available_limit)}</TableCell>
                    <TableCell>
                      <span className="font-mono font-bold">{p.score_grade}</span>
                      <span className="text-xs text-muted-foreground ml-1">({p.score_numeric})</span>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={riskColors[p.risk_classification]}>{riskLabels[p.risk_classification]}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{statusLabels[p.credit_status]}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.last_analysis_date ? formatDate(p.last_analysis_date) : '—'}</TableCell>
                    <TableCell><Button variant="ghost" size="sm">Editar</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? 'Editar Análise de Crédito' : 'Nova Análise de Crédito'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            {!form.id && (
              <div>
                <Label>Cliente</Label>
                <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => !profiles.some(p => p.client_id === c.id)).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Limite de Crédito</Label>
                <Input type="number" value={form.credit_limit || 0} onChange={e => setForm({ ...form, credit_limit: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Score (0-100)</Label>
                <Input type="number" min={0} max={100} value={form.score_numeric || 50} onChange={e => setForm({ ...form, score_numeric: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Classificação de Risco</Label>
                <Select value={form.risk_classification} onValueChange={v => setForm({ ...form, risk_classification: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo Risco</SelectItem>
                    <SelectItem value="medium">Médio Risco</SelectItem>
                    <SelectItem value="high">Alto Risco</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status de Crédito</Label>
                <Select value={form.credit_status} onValueChange={v => setForm({ ...form, credit_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="analysis">Em Análise</SelectItem>
                    <SelectItem value="restricted">Restrito</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações da Análise</Label>
              <Textarea value={form.analysis_notes || ''} onChange={e => setForm({ ...form, analysis_notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
