import { useState, useMemo, useCallback } from 'react';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, Target, TrendingUp, Pencil, MoreHorizontal, Trophy, XCircle, ArrowRight, Clock, BarChart3, AlertTriangle } from 'lucide-react';
import { useSalesFunnel, useCreateFunnelItem, useUpdateFunnelItem, FUNNEL_STAGES, type DbFunnelItem } from '@/hooks/commercial/useSalesFunnel';
import { PlaybookTips } from '@/components/comercial/PlaybookTips';
import { useClients } from '@/hooks/commercial/useClients';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { formatBRL, formatDate } from '@/lib/formatters';

const KANBAN_STAGES = FUNNEL_STAGES.slice(0, 6);

export default function SalesFunnelPage() {
  const { data: funnel = [], isLoading } = useSalesFunnel();
  const { data: clients = [] } = useClients();
  const { data: reps = [] } = useSalesReps();
  const createItem = useCreateFunnelItem();
  const updateItem = useUpdateFunnelItem();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbFunnelItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<DbFunnelItem | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('kanban');
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
    const lost = funnel.filter(f => f.status === 'lost');
    const wonValue = won.reduce((s, f) => s + f.value, 0);
    const conversionRate = (won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0;
    return { openCount: open.length, totalValue, weightedValue, wonValue, conversionRate, wonCount: won.length, lostCount: lost.length };
  }, [funnel]);

  // Stage metrics: count, value, avg time in stage, conversion to next
  const stageMetrics = useMemo(() => {
    const now = new Date();
    return FUNNEL_STAGES.map((stage, idx) => {
      const inStage = funnel.filter(f => f.stage === stage.value && f.status === 'open');
      const value = inStage.reduce((s, f) => s + f.value, 0);
      // Average time in current stage (days since updated_at or created_at)
      const avgDays = inStage.length > 0
        ? inStage.reduce((s, f) => s + differenceInDays(now, new Date(f.updated_at || f.created_at)), 0) / inStage.length
        : 0;
      // Items that moved past this stage (won or in later stages)
      const pastStage = funnel.filter(f => {
        const fIdx = FUNNEL_STAGES.findIndex(s => s.value === f.stage);
        return fIdx > idx || f.status === 'won';
      });
      const enteredStage = funnel.filter(f => {
        const fIdx = FUNNEL_STAGES.findIndex(s => s.value === f.stage);
        return fIdx >= idx || f.status === 'won' || f.status === 'lost';
      });
      const stageConversion = enteredStage.length > 0 ? (pastStage.length / enteredStage.length) * 100 : 0;
      
      return { ...stage, count: inStage.length, totalValue: value, avgDays: Math.round(avgDays), stageConversion: Math.round(stageConversion) };
    });
  }, [funnel]);

  // Stagnation alerts: items in same stage for > 14 days
  const stagnantItems = useMemo(() => {
    const now = new Date();
    return funnel.filter(f => {
      if (f.status !== 'open') return false;
      const days = differenceInDays(now, new Date(f.updated_at || f.created_at));
      return days > 14;
    }).sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  }, [funnel]);

  const grouped = useMemo(() => {
    const map: Record<string, DbFunnelItem[]> = {};
    KANBAN_STAGES.forEach(s => { map[s.value] = []; });
    funnel.filter(f => f.status === 'open').forEach(f => {
      if (map[f.stage]) map[f.stage].push(f);
    });
    return map;
  }, [funnel]);

  // Funnel chart data (for analytics tab)
  const funnelChartData = useMemo(() => {
    return FUNNEL_STAGES.map(stage => {
      const items = funnel.filter(f => f.stage === stage.value && f.status === 'open');
      return { name: stage.label, count: items.length, value: items.reduce((s, f) => s + f.value, 0) };
    }).filter(d => d.count > 0);
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
    if (!formData.title) return toastError('Título obrigatório');
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
    toastSuccess('🏆 Oportunidade ganha!', item.title);
  };

  const markAsLost = async (item: DbFunnelItem) => {
    await updateItem.mutateAsync({ id: item.id, status: 'lost', lost_date: new Date().toISOString() } as any);
    toastSuccess('Oportunidade perdida', item.title);
  };

  const moveToNextStage = async (item: DbFunnelItem) => {
    const idx = KANBAN_STAGES.findIndex(s => s.value === item.stage);
    if (idx < KANBAN_STAGES.length - 1) {
      const next = KANBAN_STAGES[idx + 1].value;
      await updateItem.mutateAsync({ id: item.id, stage: next } as any);
    }
  };

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6 mt-6">
        <KPICard index={0} title="Oportunidades Abertas" value={stats.openCount.toString()} icon={<Target className="h-5 w-5" />} accentColor="info" />
        <KPICard index={1} title="Valor Pipeline" value={formatBRL(stats.totalValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={2} title="Valor Ponderado" value={formatBRL(stats.weightedValue)} icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
        <KPICard index={3} title="Ganhos Totais" value={formatBRL(stats.wonValue)} subtitle={`${stats.wonCount} oportunidades`} icon={<Trophy className="h-5 w-5" />} accentColor="success" />
        <KPICard index={4} title="Taxa Conversão" value={`${stats.conversionRate.toFixed(1)}%`} subtitle={`${stats.lostCount} perdidas`} icon={<BarChart3 className="h-5 w-5" />} accentColor="warning" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="analytics">Métricas por Etapa</TabsTrigger>
          <TabsTrigger value="alerts">Alertas ({stagnantItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {/* Kanban Board */}
          <div className="grid gap-3 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${KANBAN_STAGES.length}, minmax(220px, 1fr))` }}>
            {KANBAN_STAGES.map(stage => {
              const items = grouped[stage.value] || [];
              const stageValue = items.reduce((s, i) => s + i.value, 0);
              const isOver = dragOverStage === stage.value;
              const metric = stageMetrics.find(m => m.value === stage.value);
              return (
                <div
                  key={stage.value}
                  className={`flex flex-col min-h-[400px] rounded-lg transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''}`}
                  onDragOver={e => handleDragOver(e, stage.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, stage.value)}
                >
                  <div className="flex items-center justify-between mb-1 px-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide">{stage.label}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{items.length}</Badge>
                      <PlaybookTips stage={stage.value} compact />
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openNew(stage.value)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] text-muted-foreground">{formatBRL(stageValue)}</span>
                    {metric && metric.avgDays > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />{metric.avgDays}d
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {items.map(item => {
                      const daysInStage = differenceInDays(new Date(), new Date(item.updated_at || item.created_at));
                      const isStagnant = daysInStage > 14;
                      return (
                        <Card
                          key={item.id}
                          draggable
                          onDragStart={e => handleDragStart(e, item)}
                          className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedItem?.id === item.id ? 'opacity-40' : ''} ${isStagnant ? 'border-warning/50' : ''}`}
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
                            <p className="text-xs text-primary font-semibold">{formatBRL(item.value)}</p>
                            {item.contact_name && <p className="text-[11px] text-muted-foreground">{item.contact_name}</p>}
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px]">{item.probability}%</Badge>
                                {isStagnant && (
                                  <Badge variant="secondary" className="text-[9px] px-1 py-0 text-warning">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />{daysInStage}d
                                  </Badge>
                                )}
                              </div>
                              {item.expected_close_date && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(item.expected_close_date)}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
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
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          {/* Stage Metrics Table */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Métricas por Etapa do Funil</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Etapa</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Qtd</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Valor</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Tempo Médio</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">Conversão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageMetrics.map((m, idx) => (
                      <tr key={m.value} className={idx < stageMetrics.length - 1 ? 'border-b' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                            <span className="font-medium">{m.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="secondary" className="font-mono">{m.count}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{formatBRL(m.totalValue)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className={m.avgDays > 14 ? 'text-warning font-semibold' : ''}>{m.avgDays} dias</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <Progress value={m.stageConversion} className="h-1.5 w-16" />
                            <span className="text-xs font-medium w-10 text-right">{m.stageConversion}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Funnel Chart */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-medium">Distribuição do Pipeline</CardTitle></CardHeader>
            <CardContent>
              {funnelChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelChartData}>
                    <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={60} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      formatter={(v: number, name: string) => [name === 'value' ? formatBRL(v) : v, name === 'value' ? 'Valor' : 'Quantidade']}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-10">Sem dados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Oportunidades Estagnadas ({stagnantItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stagnantItems.length > 0 ? (
                <div className="space-y-3">
                  {stagnantItems.map(item => {
                    const days = differenceInDays(new Date(), new Date(item.updated_at || item.created_at));
                    const stage = FUNNEL_STAGES.find(s => s.value === item.stage);
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${stage?.color || 'bg-muted'}`} />
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {stage?.label} • {formatBRL(item.value)} • Parado há <span className="font-semibold text-warning">{days} dias</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => moveToNextStage(item)}>
                            <ArrowRight className="h-3 w-3 mr-1" />Avançar
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => openEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">Nenhuma oportunidade estagnada 🎉</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
