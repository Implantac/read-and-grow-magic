import { useState, useMemo, useCallback } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, Target, TrendingUp, Pencil, MoreHorizontal, Trophy, XCircle, ArrowRight } from 'lucide-react';
import { useSalesFunnel, useCreateFunnelItem, useUpdateFunnelItem, FUNNEL_STAGES, type DbFunnelItem } from '@/hooks/useSalesFunnel';
import { useClients } from '@/hooks/useClients';
import { useSalesReps } from '@/hooks/useSalesReps';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const KANBAN_STAGES = FUNNEL_STAGES.slice(0, 6);

export default function SalesFunnelPage() {
  const { data: funnel = [], isLoading } = useSalesFunnel();
  const { data: clients = [] } = useClients();
  const { data: reps = [] } = useSalesReps();
  const createItem = useCreateFunnelItem();
  const updateItem = useUpdateFunnelItem();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbFunnelItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<DbFunnelItem | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', description: '', stage: 'lead', value: '', probability: '10',
    expected_close_date: '', contact_name: '', contact_email: '', contact_phone: '',
    source: '', notes: '', client_id: '', sales_rep_id: '',
  });

  const stats = useMemo(() => {
    const open = funnel.filter(f => f.status === 'open');
    const totalValue = open.reduce((s, f) => s + f.value, 0);
    const weightedValue = open.reduce((s, f) => s + (f.value * f.probability / 100), 0);
    const won = funnel.filter(f => f.status === 'won');
    const wonValue = won.reduce((s, f) => s + f.value, 0);
    return { openCount: open.length, totalValue, weightedValue, wonValue };
  }, [funnel]);

  const grouped = useMemo(() => {
    const map: Record<string, DbFunnelItem[]> = {};
    KANBAN_STAGES.forEach(s => { map[s.value] = []; });
    funnel.filter(f => f.status === 'open').forEach(f => {
      if (map[f.stage]) map[f.stage].push(f);
    });
    return map;
  }, [funnel]);

  const resetForm = () => {
    setFormData({
      title: '', description: '', stage: 'lead', value: '', probability: '10',
      expected_close_date: '', contact_name: '', contact_email: '', contact_phone: '',
      source: '', notes: '', client_id: '', sales_rep_id: '',
    });
    setEditingItem(null);
  };

  const openNew = (stage?: string) => {
    resetForm();
    if (stage) setFormData(p => ({ ...p, stage }));
    setIsFormOpen(true);
  };

  const openEdit = (item: DbFunnelItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title, description: item.description || '', stage: item.stage,
      value: item.value.toString(), probability: item.probability.toString(),
      expected_close_date: item.expected_close_date ? item.expected_close_date.split('T')[0] : '',
      contact_name: item.contact_name || '', contact_email: item.contact_email || '',
      contact_phone: item.contact_phone || '', source: item.source || '',
      notes: item.notes || '', client_id: item.client_id || '', sales_rep_id: item.sales_rep_id || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) return toast({ title: 'Título obrigatório', variant: 'destructive' });
    const payload: any = {
      title: formData.title, description: formData.description || null, stage: formData.stage,
      value: parseFloat(formData.value) || 0, probability: parseInt(formData.probability) || 10,
      expected_close_date: formData.expected_close_date || null,
      contact_name: formData.contact_name || null, contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null, source: formData.source || null,
      notes: formData.notes || null,
      client_id: formData.client_id || null, sales_rep_id: formData.sales_rep_id || null,
    };
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...payload });
    } else {
      await createItem.mutateAsync(payload);
    }
    setIsFormOpen(false);
    resetForm();
  };

  const markAsWon = async (item: DbFunnelItem) => {
    await updateItem.mutateAsync({ id: item.id, status: 'won', won_date: new Date().toISOString() } as any);
    toast({ title: '🏆 Oportunidade ganha!', description: item.title });
  };

  const markAsLost = async (item: DbFunnelItem) => {
    await updateItem.mutateAsync({ id: item.id, status: 'lost', lost_date: new Date().toISOString() } as any);
    toast({ title: 'Oportunidade perdida', description: item.title });
  };

  const moveToNextStage = async (item: DbFunnelItem) => {
    const idx = KANBAN_STAGES.findIndex(s => s.value === item.stage);
    if (idx < KANBAN_STAGES.length - 1) {
      const next = KANBAN_STAGES[idx + 1].value;
      await updateItem.mutateAsync({ id: item.id, stage: next } as any);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: DbFunnelItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageValue: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageValue);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedItem && draggedItem.stage !== targetStage) {
      await updateItem.mutateAsync({ id: draggedItem.id, stage: targetStage } as any);
    }
    setDraggedItem(null);
  }, [draggedItem, updateItem]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Funil Comercial" description="Pipeline de vendas" />
        <div className="grid gap-4 md:grid-cols-4 mt-6"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Funil Comercial" description="Pipeline visual de oportunidades — arraste cards entre etapas">
        <Button onClick={() => openNew()} size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Oportunidade</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4 mb-6 mt-6">
        <KPICard index={0} title="Oportunidades Abertas" value={stats.openCount.toString()} icon={<Target className="h-5 w-5" />} accentColor="info" />
        <KPICard index={1} title="Valor Total Pipeline" value={fmt(stats.totalValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={2} title="Valor Ponderado" value={fmt(stats.weightedValue)} icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
        <KPICard index={3} title="Ganhos Totais" value={fmt(stats.wonValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="success" />
      </div>

      {/* Kanban Board */}
      <div className="grid gap-3 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${KANBAN_STAGES.length}, minmax(220px, 1fr))` }}>
        {KANBAN_STAGES.map(stage => {
          const items = grouped[stage.value] || [];
          const stageValue = items.reduce((s, i) => s + i.value, 0);
          const isOver = dragOverStage === stage.value;
          return (
            <div
              key={stage.value}
              className={`flex flex-col min-h-[400px] rounded-lg transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}
              onDragOver={e => handleDragOver(e, stage.value)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage.value)}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide">{stage.label}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5">{items.length}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openNew(stage.value)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="text-[10px] text-muted-foreground mb-2 px-1">{fmt(stageValue)}</div>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {items.map(item => (
                  <Card
                    key={item.id}
                    draggable
                    onDragStart={e => handleDragStart(e, item)}
                    className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedItem?.id === item.id ? 'opacity-40' : ''}`}
                  >
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium line-clamp-2 flex-1">{item.title}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"><MoreHorizontal className="h-3 w-3" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => moveToNextStage(item)}><ArrowRight className="h-3.5 w-3.5 mr-2" />Avançar Etapa</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => markAsWon(item)} className="text-emerald-600"><Trophy className="h-3.5 w-3.5 mr-2" />Marcar como Ganha</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markAsLost(item)} className="text-destructive"><XCircle className="h-3.5 w-3.5 mr-2" />Marcar como Perdida</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-primary font-semibold">{fmt(item.value)}</p>
                      {item.contact_name && <p className="text-[11px] text-muted-foreground">{item.contact_name}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <Badge variant="outline" className="text-[10px]">{item.probability}%</Badge>
                        {item.expected_close_date && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.expected_close_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground border border-dashed rounded-lg">
                    Nenhuma oportunidade
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
            <DialogDescription>Preencha os dados da oportunidade</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Etapa</Label>
                <Select value={formData.stage} onValueChange={v => setFormData(p => ({ ...p, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FUNNEL_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valor (R$)</Label><Input type="number" value={formData.value} onChange={e => setFormData(p => ({ ...p, value: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Probabilidade (%)</Label><Input type="number" min="0" max="100" value={formData.probability} onChange={e => setFormData(p => ({ ...p, probability: e.target.value }))} /></div>
              <div><Label>Previsão Fechamento</Label><Input type="date" value={formData.expected_close_date} onChange={e => setFormData(p => ({ ...p, expected_close_date: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Cliente</Label>
              <Select value={formData.client_id} onValueChange={v => setFormData(p => ({ ...p, client_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Representante</Label>
              <Select value={formData.sales_rep_id} onValueChange={v => setFormData(p => ({ ...p, sales_rep_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{reps.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Contato</Label><Input value={formData.contact_name} onChange={e => setFormData(p => ({ ...p, contact_name: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={formData.contact_email} onChange={e => setFormData(p => ({ ...p, contact_email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={formData.contact_phone} onChange={e => setFormData(p => ({ ...p, contact_phone: e.target.value }))} /></div>
            </div>
            <div><Label>Origem</Label><Input value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} placeholder="Ex: Site, Indicação, Feira..." /></div>
            <div><Label>Descrição</Label><Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
            <div><Label>Observações</Label><Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createItem.isPending || updateItem.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
