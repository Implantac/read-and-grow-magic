import { useMemo, useState } from 'react';
import {
  useNPSCampaigns,
  useNPSQuestions,
  useQuestionBank,
  useSaveQuestionToBank,
  useImportQuestionsFromBank,
  useDeleteQuestionFromBank,
  useReorderQuestion,
  publicSurveyUrl,
} from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { Checkbox } from '@/ui/base/checkbox';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Plus, Trash2, Library, BookmarkPlus, Search, Sparkles, Trash, ArrowUp, ArrowDown, ExternalLink, GripVertical } from 'lucide-react';
import { Switch } from '@/ui/base/switch';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';




const TYPES = [
  { v: 'text', label: 'Texto livre' },
  { v: 'number', label: 'Número' },
  { v: 'radio', label: 'Escolha única' },
  { v: 'checkbox', label: 'Múltipla escolha' },
  { v: 'dropdown', label: 'Lista suspensa' },
  { v: 'stars', label: 'Estrelas (1–5)' },
  { v: 'emoji', label: 'Emoji (1–5)' },
  { v: 'likert', label: 'Escala Likert' },
  { v: 'date', label: 'Data' },
];

export default function Surveys() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined);
  const { data: questions = [], isLoading } = useNPSQuestions(campaignId);
  const { currentCompany } = useEnterprise() as any;
  const activeCompanyId = currentCompany?.id;
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: any) => {
      const { error } = await supabase.from('nps_questions').insert({ ...input, company_id: activeCompanyId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Pergunta adicionada'); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
  });

  const saveToBank = useSaveQuestionToBank();

  const [form, setForm] = useState<{ question_text: string; question_type: string; required: boolean; choices: string }>({
    question_text: '', question_type: 'text', required: false, choices: '',
  });
  const [bankOpen, setBankOpen] = useState(false);

  const submitNew = () => {
    if (!form.question_text || !campaignId) return;
    const needsOptions = ['radio', 'checkbox', 'dropdown', 'multi_choice'].includes(form.question_type);
    const options = needsOptions
      ? { choices: form.choices.split('\n').map((s) => s.trim()).filter(Boolean) }
      : null;
    if (needsOptions && (!options || (options.choices?.length ?? 0) < 2)) {
      toast.error('Adicione pelo menos 2 opções (uma por linha)');
      return;
    }
    create.mutate({
      campaign_id: campaignId,
      question_text: form.question_text,
      question_type: form.question_type,
      required: form.required,
      options,
      order_index: questions.length,
    });
    setForm({ question_text: '', question_type: form.question_type, required: false, choices: '' });
  };

  const saveCurrentToBank = (q: any) => {
    saveToBank.mutate({
      category: 'Personalizadas',
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      required: q.required,
      tags: [],
    });
  };

  const reorder = useReorderQuestion();

  const updateReq = useMutation({
    mutationFn: async ({ id, required }: { id: string; required: boolean }) => {
      const { error } = await supabase.from('nps_questions').update({ required }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
    onError: (e: any) => toast.error(e.message),
  });

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    persistOrder(arrayMove(questions as any[], idx, target));
  };

  const persistOrder = (ordered: any[]) => {
    ordered.forEach((q, i) => {
      if (q.order_index !== i) reorder.mutate({ id: q.id, order_index: i });
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = (questions as any[]).findIndex((q) => q.id === active.id);
    const newIdx = (questions as any[]).findIndex((q) => q.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    persistOrder(arrayMove(questions as any[], oldIdx, newIdx));
  };


  const previewCampaign = async () => {
    if (!campaignId) return;
    // Pega um token existente da campanha para abrir a pesquisa como o cliente veria
    const { data } = await supabase
      .from('nps_tokens')
      .select('token, nps_invites!inner(campaign_id,status)')
      .eq('nps_invites.campaign_id', campaignId)
      .neq('nps_invites.status', 'responded')
      .limit(1)
      .maybeSingle();
    if (data?.token) {
      window.open(`${window.location.origin}/nps/${data.token}`, '_blank');
    } else {
      toast.info('Gere um convite primeiro na aba Convites para visualizar como o cliente verá.');
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pesquisas personalizadas</h2>
          <p className="text-sm text-muted-foreground">
            Além da nota NPS, adicione perguntas específicas por campanha. Use a <strong>biblioteca de perguntas</strong> para reaproveitar em segundos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={previewCampaign} disabled={!campaignId}>
            <ExternalLink className="mr-2 h-4 w-4" /> Visualizar
          </Button>
          <Button variant="outline" onClick={() => setBankOpen(true)} disabled={!campaignId}>
            <Library className="mr-2 h-4 w-4" /> Biblioteca de perguntas
          </Button>
        </div>
      </div>

      <div className="max-w-md">
        <Label>Campanha</Label>
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger><SelectValue placeholder="Selecione uma campanha" /></SelectTrigger>
          <SelectContent>{campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {campaignId && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nova pergunta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label>Texto da pergunta</Label>
                  <Input value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} placeholder="Ex.: Como você avalia o atendimento?" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.question_type} onValueChange={(v) => setForm({ ...form, question_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {['radio', 'checkbox', 'dropdown', 'multi_choice'].includes(form.question_type) && (
                <div>
                  <Label>Opções (uma por linha)</Label>
                  <textarea
                    value={form.choices}
                    onChange={(e) => setForm({ ...form, choices: e.target.value })}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={"Ótimo\nBom\nRegular\nRuim"}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.required} onCheckedChange={(v) => setForm({ ...form, required: !!v })} /> Obrigatória
                </label>
                <Button onClick={submitNew} disabled={!form.question_text || create.isPending}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="space-y-2">
              {questions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Arraste as perguntas pelo ícone <GripVertical className="inline h-3 w-3" /> para reordenar. Use o switch para marcar como obrigatória.
                </p>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={(questions as any[]).map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  {(questions as any[]).map((q, i) => (
                    <SortableQuestion
                      key={q.id}
                      q={q}
                      index={i}
                      total={questions.length}
                      onMoveUp={() => move(i, -1)}
                      onMoveDown={() => move(i, 1)}
                      onToggleRequired={(v) => updateReq.mutate({ id: q.id, required: v })}
                      onSaveToBank={() => saveCurrentToBank(q)}
                      onDelete={() => del.mutate(q.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sem perguntas extras. A pesquisa exibirá apenas a nota NPS e um comentário aberto.
                </p>
              )}
            </div>
          )}

        </>
      )}


      <BankDialog open={bankOpen} onOpenChange={setBankOpen} campaignId={campaignId} currentCount={questions.length} />
    </div>
  );
}

function SortableQuestion({
  q, index, total, onMoveUp, onMoveDown, onToggleRequired, onSaveToBank, onDelete,
}: {
  q: any;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleRequired: (v: boolean) => void;
  onSaveToBank: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? 'ring-2 ring-primary/40' : ''}>
        <CardContent className="pt-4 flex justify-between items-start gap-3">
          <button
            type="button"
            className="mt-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
            aria-label="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="font-medium">{index + 1}. {q.question_text}</div>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1">
              <Badge variant="outline">{q.question_type}</Badge>
              {q.required && <Badge variant="secondary">obrigatória</Badge>}
              {q.options?.choices?.length ? <span>{q.options.choices.length} opções</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Obrig.
              <Switch checked={!!q.required} onCheckedChange={onToggleRequired} />
            </label>
            <Button size="icon" variant="ghost" title="Mover para cima" disabled={index === 0} onClick={onMoveUp}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" title="Mover para baixo" disabled={index === total - 1} onClick={onMoveDown}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" title="Salvar na biblioteca" onClick={onSaveToBank}>
              <BookmarkPlus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BankDialog({ open, onOpenChange, campaignId, currentCount }: { open: boolean; onOpenChange: (b: boolean) => void; campaignId?: string; currentCount: number }) {

  const [tab, setTab] = useState<'global' | 'company'>('global');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: bank = [], isLoading } = useQuestionBank({ search, category });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const importMut = useImportQuestionsFromBank();
  const delBank = useDeleteQuestionFromBank();

  const filtered = useMemo(() => {
    return (bank as any[]).filter((q) => (tab === 'global' ? q.is_global : !q.is_global));
  }, [bank, tab]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    (bank as any[]).forEach((q) => s.add(q.category));
    return Array.from(s).sort();
  }, [bank]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const doImport = () => {
    if (!campaignId || selected.size === 0) return;
    importMut.mutate(
      { campaign_id: campaignId, bank_ids: Array.from(selected), start_order: currentCount },
      { onSuccess: () => { setSelected(new Set()); onOpenChange(false); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Library className="h-4 w-4" /> Biblioteca de perguntas</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="global"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Curadoria da plataforma</TabsTrigger>
            <TabsTrigger value="company">Suas perguntas</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-2 my-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pergunta…" className="pl-8" />
            </div>
            <Select value={category ?? '__all'} onValueChange={(v) => setCategory(v === '__all' ? undefined : v)}>
              <SelectTrigger className="md:w-64"><SelectValue placeholder="Todas as categorias" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as categorias</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={tab} className="mt-0">
            <div className="max-h-[420px] overflow-y-auto border rounded divide-y">
              {isLoading && <div className="p-6"><Skeleton className="h-24" /></div>}
              {!isLoading && filtered.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  {tab === 'global' ? 'Nenhuma pergunta na curadoria.' : 'Você ainda não salvou perguntas na biblioteca.'}
                </p>
              )}
              {filtered.map((q: any) => (
                <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-muted/40 cursor-pointer">
                  <Checkbox checked={selected.has(q.id)} onCheckedChange={() => toggle(q.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{q.question_text}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="outline">{q.category}</Badge>
                      <Badge variant="secondary">{q.question_type}</Badge>
                      {q.required && <Badge>obrigatória</Badge>}
                      {q.options?.choices?.length ? <span>· {q.options.choices.length} opções</span> : null}
                      {q.usage_count > 0 && <span>· usada {q.usage_count}×</span>}
                    </div>
                  </div>
                  {tab === 'company' && (
                    <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); delBank.mutate(q.id); }}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </label>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <span className="text-xs text-muted-foreground">{selected.size} selecionada(s)</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={doImport} disabled={selected.size === 0 || !campaignId || importMut.isPending}>
              Adicionar {selected.size} à campanha
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
