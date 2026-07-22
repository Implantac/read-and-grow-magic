import { useState } from 'react';
import {
  useNPSCampaigns,
  useNPSQuestions,
  useSaveQuestionToBank,
  useReorderQuestion,
} from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/ui/base/button';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Skeleton } from '@/ui/base/skeleton';
import { ExternalLink, GripVertical, Library } from 'lucide-react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { OPTION_TYPES } from './surveys/constants';
import { NewQuestionForm, type NewQuestionFormState } from './surveys/NewQuestionForm';
import { SortableQuestion } from './surveys/SortableQuestion';
import { BankDialog } from './surveys/BankDialog';

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

  const [form, setForm] = useState<NewQuestionFormState>({
    question_text: '', question_type: 'text', required: false, choices: '',
  });
  const [bankOpen, setBankOpen] = useState(false);

  const submitNew = () => {
    if (!form.question_text || !campaignId) return;
    const needsOptions = OPTION_TYPES.includes(form.question_type);
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

  const updateQ = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, any> }) => {
      const { error } = await (supabase.from('nps_questions') as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
    onError: (e: any) => toast.error(e.message),
  });

  const persistOrder = (ordered: any[]) => {
    ordered.forEach((q, i) => {
      if (q.order_index !== i) reorder.mutate({ id: q.id, order_index: i });
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    persistOrder(arrayMove(questions as any[], idx, target));
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
          <NewQuestionForm form={form} setForm={setForm} onSubmit={submitNew} submitting={create.isPending} />

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
                      onToggleRequired={(v) => updateQ.mutate({ id: q.id, patch: { required: v } })}
                      onEdit={(patch) => updateQ.mutate({ id: q.id, patch })}
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
