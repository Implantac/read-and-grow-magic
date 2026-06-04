import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Textarea } from '@/ui/base/textarea';
import { Progress } from '@/ui/base/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Skeleton } from '@/ui/base/skeleton';
import { Plus, Megaphone, Target, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useCampaigns, useCreateCampaign, useUpdateCampaign, type DbCampaign } from '@/hooks/commercial/useSalesIntelligence';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatBRL } from '@/lib/formatters';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  active: { label: 'Ativa', variant: 'default' },
  paused: { label: 'Pausada', variant: 'secondary' },
  completed: { label: 'Concluída', variant: 'default' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const GOAL_LABELS: Record<string, string> = {
  revenue: 'Faturamento',
  orders: 'Pedidos',
  clients: 'Clientes',
  products: 'Unidades',
};

export default function Campaigns() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', campaign_type: 'product_focus', goal_type: 'revenue',
    goal_value: '', start_date: '', end_date: '', incentive_description: '',
  });

  const handleSave = async () => {
    if (!formData.name) return;
    await createCampaign.mutateAsync({
      name: formData.name,
      description: formData.description || null,
      campaign_type: formData.campaign_type,
      goal_type: formData.goal_type,
      goal_value: parseFloat(formData.goal_value) || 0,
      start_date: formData.start_date,
      end_date: formData.end_date,
      incentive_description: formData.incentive_description || null,
      status: 'draft',
    } as any);
    setFormOpen(false);
    setFormData({ name: '', description: '', campaign_type: 'product_focus', goal_type: 'revenue', goal_value: '', start_date: '', end_date: '', incentive_description: '' });
  };

  const activateCampaign = async (id: string) => {
    await updateCampaign.mutateAsync({ id, status: 'active' } as any);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Campanhas de Vendas" description="Impulsione resultados com campanhas internas" />
        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Campanhas de Vendas" description="Crie campanhas internas para impulsionar metas e engajar o time">
        <Button onClick={() => setFormOpen(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Campanha</Button>
      </PageHeader>

      {campaigns.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">Nenhuma campanha criada</p>
            <p className="text-sm text-muted-foreground mb-4">Crie campanhas internas para focar o time em produtos ou metas específicas.</p>
            <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Criar Campanha</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {campaigns.map(campaign => {
            const pct = campaign.goal_value > 0 ? (campaign.current_value / campaign.goal_value) * 100 : 0;
            const statusInfo = STATUS_MAP[campaign.status] || STATUS_MAP.draft;
            return (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{campaign.name}</CardTitle>
                      {campaign.description && <p className="text-xs text-muted-foreground mt-1">{campaign.description}</p>}
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {campaign.start_date && format(new Date(campaign.start_date), 'dd/MM/yyyy')} — {campaign.end_date && format(new Date(campaign.end_date), 'dd/MM/yyyy')}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Meta: {campaign.goal_type === 'revenue' ? formatBRL(campaign.goal_value) : campaign.goal_value}</span>
                      <span className="font-medium">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-2" />
                  </div>
                  {campaign.incentive_description && (
                    <div className="flex items-start gap-2 p-2 rounded bg-primary/5 text-xs">
                      <TrendingUp className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                      <span>{campaign.incentive_description}</span>
                    </div>
                  )}
                  {campaign.status === 'draft' && (
                    <Button size="sm" className="w-full" variant="outline" onClick={() => activateCampaign(campaign.id)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Ativar Campanha
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Campanha de Vendas</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Campanha</label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Queima de estoque - Linha Premium" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Meta</label>
                <Select value={formData.goal_type} onValueChange={v => setFormData(p => ({ ...p, goal_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Faturamento (R$)</SelectItem>
                    <SelectItem value="orders">Qtd. Pedidos</SelectItem>
                    <SelectItem value="clients">Qtd. Clientes</SelectItem>
                    <SelectItem value="products">Unidades Vendidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Valor da Meta</label>
                <Input type="number" value={formData.goal_value} onChange={e => setFormData(p => ({ ...p, goal_value: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim</label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Incentivo / Premiação</label>
              <Input value={formData.incentive_description} onChange={e => setFormData(p => ({ ...p, incentive_description: e.target.value }))} placeholder="Ex: Bônus de R$ 500 para quem bater a meta" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createCampaign.isPending}>Criar Campanha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
