import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { useCommissionPolicies, useCommissions, useCommissionMutations } from '@/hooks/useCommissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DollarSign, TrendingUp, CheckCircle, Clock, Plus, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const currentPeriod = format(new Date(), 'yyyy-MM');

const statusColors: Record<string, string> = {
  forecast: 'bg-blue-100 text-blue-800',
  blocked: 'bg-red-100 text-red-800',
  released: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  forecast: 'Prevista',
  blocked: 'Bloqueada',
  released: 'Liberada',
  approved: 'Aprovada',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

export default function CommissionsPage() {
  const [tab, setTab] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  const { data: policies = [], isLoading: loadingPolicies } = useCommissionPolicies();
  const { data: commissions = [], isLoading: loadingCommissions } = useCommissions({ period: currentPeriod });
  const { createPolicy, updateCommissionStatus } = useCommissionMutations();

  const [newPolicy, setNewPolicy] = useState({
    name: '', calculation_type: 'percentage', base_percentage: 0, extra_percentage: 0,
    requires_invoicing: false, requires_payment: false, applies_to: 'all',
    min_margin_pct: 0, max_discount_pct: 100,
  });

  const totalForecast = commissions.filter(c => c.status === 'forecast').reduce((s, c) => s + (c.calculated_value || 0), 0);
  const totalReleased = commissions.filter(c => c.status === 'released').reduce((s, c) => s + (c.calculated_value || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + (c.calculated_value || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.calculated_value || 0), 0);

  const filteredCommissions = commissions.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.sales_rep_name?.toLowerCase().includes(search.toLowerCase()) && !c.order_number?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreatePolicy = () => {
    createPolicy.mutate(newPolicy);
    setShowPolicyDialog(false);
    setNewPolicy({ name: '', calculation_type: 'percentage', base_percentage: 0, extra_percentage: 0, requires_invoicing: false, requires_payment: false, applies_to: 'all', min_margin_pct: 0, max_discount_pct: 100 });
  };

  return (
    <PageContainer>
      <PageHeader title="Comissões" description="Gestão de comissões, políticas e pagamentos" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Prevista" value={`R$ ${totalForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<Clock className="h-5 w-5" />} index={0} accentColor="info" />
        <KPICard title="Liberada" value={`R$ ${totalReleased.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<TrendingUp className="h-5 w-5" />} index={1} accentColor="warning" />
        <KPICard title="Aprovada" value={`R$ ${totalApproved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<CheckCircle className="h-5 w-5" />} index={2} accentColor="success" />
        <KPICard title="Paga" value={`R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<DollarSign className="h-5 w-5" />} index={3} accentColor="primary" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Comissões</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por vendedor ou pedido..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma comissão encontrada para este período</TableCell></TableRow>
                  ) : filteredCommissions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.order_number || '-'}</TableCell>
                      <TableCell>{c.sales_rep_name || '-'}</TableCell>
                      <TableCell>{c.client_name || '-'}</TableCell>
                      <TableCell>R$ {(c.base_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{c.applied_percentage}%</TableCell>
                      <TableCell className="font-semibold">R$ {(c.calculated_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell><Badge className={statusColors[c.status] || ''}>{statusLabels[c.status] || c.status}</Badge></TableCell>
                      <TableCell>
                        {c.status === 'forecast' && (
                          <Button size="sm" variant="outline" onClick={() => updateCommissionStatus.mutate({ id: c.id, status: 'released' })}>Liberar</Button>
                        )}
                        {c.status === 'released' && (
                          <Button size="sm" variant="outline" onClick={() => updateCommissionStatus.mutate({ id: c.id, status: 'approved', approved_at: new Date().toISOString() })}>Aprovar</Button>
                        )}
                        {c.status === 'approved' && (
                          <Button size="sm" variant="default" onClick={() => updateCommissionStatus.mutate({ id: c.id, status: 'paid', paid_at: new Date().toISOString() })}>Pagar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nova Política</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Nova Política de Comissão</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nome</Label><Input value={newPolicy.name} onChange={e => setNewPolicy(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tipo</Label>
                      <Select value={newPolicy.calculation_type} onValueChange={v => setNewPolicy(p => ({ ...p, calculation_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentual</SelectItem>
                          <SelectItem value="fixed">Fixo</SelectItem>
                          <SelectItem value="tiered">Faixas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Aplica-se a</Label>
                      <Select value={newPolicy.applies_to} onValueChange={v => setNewPolicy(p => ({ ...p, applies_to: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="internal">Internos</SelectItem>
                          <SelectItem value="external">Externos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>% Base</Label><Input type="number" value={newPolicy.base_percentage} onChange={e => setNewPolicy(p => ({ ...p, base_percentage: +e.target.value }))} /></div>
                    <div><Label>% Extra (Bônus)</Label><Input type="number" value={newPolicy.extra_percentage} onChange={e => setNewPolicy(p => ({ ...p, extra_percentage: +e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Margem Mín. (%)</Label><Input type="number" value={newPolicy.min_margin_pct} onChange={e => setNewPolicy(p => ({ ...p, min_margin_pct: +e.target.value }))} /></div>
                    <div><Label>Desc. Máx. (%)</Label><Input type="number" value={newPolicy.max_discount_pct} onChange={e => setNewPolicy(p => ({ ...p, max_discount_pct: +e.target.value }))} /></div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><Switch checked={newPolicy.requires_invoicing} onCheckedChange={v => setNewPolicy(p => ({ ...p, requires_invoicing: v }))} /><Label>Exige faturamento</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={newPolicy.requires_payment} onCheckedChange={v => setNewPolicy(p => ({ ...p, requires_payment: v }))} /><Label>Exige recebimento</Label></div>
                  </div>
                  <Button onClick={handleCreatePolicy} disabled={!newPolicy.name} className="w-full">Criar Política</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Base</span><span className="font-medium">{p.base_percentage}%</span></div>
                  {(p.extra_percentage || 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Bônus</span><span className="font-medium text-green-600">+{p.extra_percentage}%</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Margem mín.</span><span>{p.min_margin_pct}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Desc. máx.</span><span>{p.max_discount_pct}%</span></div>
                  <div className="flex gap-2 pt-2">
                    {p.requires_invoicing && <Badge variant="outline" className="text-xs">Faturamento</Badge>}
                    {p.requires_payment && <Badge variant="outline" className="text-xs">Recebimento</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {policies.length === 0 && !loadingPolicies && (
              <div className="col-span-full text-center py-12 text-muted-foreground">Nenhuma política cadastrada</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
