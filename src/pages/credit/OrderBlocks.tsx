import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { useOrderBlocks, useReleaseOrderBlock } from '@/hooks/financial/useCreditAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Lock, Unlock, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';

import { formatDate } from '@/lib/formatters';
const blockTypeLabels: Record<string, string> = {
  financial: 'Financeiro', commercial: 'Comercial', credit: 'Crédito', compliance: 'Compliance',
};
const statusColors: Record<string, string> = {
  active: 'bg-destructive/10 text-destructive', released: 'bg-emerald-500/10 text-emerald-700', expired: 'bg-muted text-muted-foreground',
};

export default function OrderBlocks() {
  const { data: blocks = [], isLoading } = useOrderBlocks();
  const release = useReleaseOrderBlock();
  const [search, setSearch] = useState('');
  const [releaseDialog, setReleaseDialog] = useState<any>(null);
  const [justification, setJustification] = useState('');

  const activeBlocks = blocks.filter(b => b.status === 'active');
  const releasedBlocks = blocks.filter(b => b.status === 'released');

  const filtered = blocks.filter(b =>
    b.block_reason.toLowerCase().includes(search.toLowerCase()) ||
    b.block_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleRelease = () => {
    if (!releaseDialog || !justification.trim()) return;
    release.mutate({ id: releaseDialog.id, released_by: 'Usuário', release_justification: justification }, {
      onSuccess: () => { setReleaseDialog(null); setJustification(''); },
    });
  };

  return (
    <PageContainer>
      <PageHeader title="Bloqueios de Pedidos" description="Gestão de bloqueios e liberações comerciais e financeiros" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KPICard title="Bloqueios Ativos" value={String(activeBlocks.length)} icon={<Lock className="h-5 w-5" />} accentColor="danger" index={0} />
        <KPICard title="Liberados" value={String(releasedBlocks.length)} icon={<Unlock className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Aguardando Aprovação" value={String(activeBlocks.filter(b => b.approval_level).length)} icon={<AlertTriangle className="h-5 w-5" />} accentColor="warning" index={2} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Todos os Bloqueios</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Bloqueado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Liberado por</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum bloqueio encontrado</TableCell></TableRow>
              ) : filtered.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.order_id.slice(0, 8)}...</TableCell>
                  <TableCell><Badge variant="outline">{blockTypeLabels[b.block_type] || b.block_type}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate">{b.block_reason}</TableCell>
                  <TableCell>{b.blocked_by || '—'}</TableCell>
                  <TableCell className="text-xs">{formatDate(b.blocked_at)}</TableCell>
                  <TableCell><Badge className={statusColors[b.status]}>{b.status === 'active' ? 'Ativo' : b.status === 'released' ? 'Liberado' : 'Expirado'}</Badge></TableCell>
                  <TableCell>{b.released_by || '—'}</TableCell>
                  <TableCell>
                    {b.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => setReleaseDialog(b)}>
                        <CheckCircle className="h-3 w-3 mr-1" />Liberar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!releaseDialog} onOpenChange={() => setReleaseDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Liberar Bloqueio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Motivo do bloqueio: <strong>{releaseDialog?.block_reason}</strong></p>
            <div>
              <Label>Justificativa da liberação *</Label>
              <Textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3} placeholder="Informe o motivo da liberação..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseDialog(null)}>Cancelar</Button>
            <Button onClick={handleRelease} disabled={!justification.trim() || release.isPending}>Confirmar Liberação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
