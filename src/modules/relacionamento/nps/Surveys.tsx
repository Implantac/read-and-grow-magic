import { useState } from 'react';
import { useNPSCampaigns, useNPSQuestions } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Checkbox } from '@/ui/base/checkbox';
import { Skeleton } from '@/ui/base/skeleton';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = ['text', 'multi_choice', 'checkbox', 'radio', 'stars', 'emoji', 'likert', 'dropdown', 'date', 'number', 'file'];

export default function Surveys() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined);
  const { data: questions = [], isLoading } = useNPSQuestions(campaignId);
  const { currentCompany } = useEnterprise() as any; const activeCompanyId = currentCompany?.id;
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
    mutationFn: async (id: string) => { const { error } = await supabase.from('nps_questions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
  });

  const [form, setForm] = useState({ question_text: '', question_type: 'text', required: false });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Pesquisas personalizadas</h2>
        <p className="text-sm text-muted-foreground">Adicione perguntas complementares à nota NPS.</p>
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
            <CardHeader><CardTitle className="text-base">Nova pergunta</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-2"><Label>Texto</Label><Input value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} /></div>
              <div><Label>Tipo</Label>
                <Select value={form.question_type} onValueChange={(v) => setForm({ ...form, question_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-1 text-sm mr-2"><Checkbox checked={form.required} onCheckedChange={(v) => setForm({ ...form, required: !!v })} /> Obrig.</label>
                <Button onClick={() => { create.mutate({ ...form, campaign_id: campaignId, order_index: questions.length }); setForm({ ...form, question_text: '' }); }} disabled={!form.question_text}><Plus className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? <Skeleton className="h-40" /> : (
            <div className="space-y-2">
              {questions.map((q: any, i: number) => (
                <Card key={q.id}>
                  <CardContent className="pt-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{i + 1}. {q.question_text}</div>
                      <div className="text-xs text-muted-foreground">{q.question_type} {q.required && '· obrigatória'}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </CardContent>
                </Card>
              ))}
              {questions.length === 0 && <p className="text-sm text-muted-foreground">Sem perguntas extras. A pesquisa exibirá apenas a nota NPS e um comentário aberto.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
