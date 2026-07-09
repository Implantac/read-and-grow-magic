import { useState } from 'react';
import { useNPSAnswers, useNPSCampaigns } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Sparkles, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function Responses() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const { data: allAnswers = [], isLoading } = useNPSAnswers(campaignId ?? null, 5000);
  const total = allAnswers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const answers = allAnswers.slice(page * pageSize, page * pageSize + pageSize);

  const analyze = async (id: string) => {
    toast.loading('Analisando com IA...', { id: 'ai' });
    const { error } = await supabase.functions.invoke('nps-ai-analyze', { body: { answer_id: id } });
    if (error) toast.error(error.message, { id: 'ai' });
    else toast.success('Análise concluída', { id: 'ai' });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Respostas</h2>
        <p className="text-sm text-muted-foreground">Notas recebidas, comentários e análise de sentimento por IA.</p>
      </div>

      <div className="max-w-md">
        <Label>Filtrar por campanha</Label>
        <Select value={campaignId ?? 'all'} onValueChange={(v) => { setCampaignId(v === 'all' ? undefined : v); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="space-y-2">
          {answers.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={a.category === 'promoter' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : a.category === 'detractor' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}>{a.score}</Badge>
                    <span className="font-medium">{a.clients?.name ?? 'Cliente'}</span>
                    {a.sentiment && <Badge variant="outline" className="capitalize">{a.sentiment}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(a.responded_at).toLocaleString('pt-BR')}</span>
                </div>
                {a.comment && <p className="text-sm text-muted-foreground">"{a.comment}"</p>}
                {a.ai_summary && <p className="text-xs italic text-primary flex gap-1 items-center"><Sparkles className="h-3 w-3" /> {a.ai_summary}</p>}
                {Array.isArray(a.ai_keywords) && a.ai_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">{a.ai_keywords.map((k: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>)}</div>
                )}
                <div className="flex gap-2 text-xs text-muted-foreground pt-1">
                  <span>{a.channel ?? '—'}</span>·
                  <span>{a.device ?? '—'}</span>·
                  <span>{a.city ?? '—'}</span>
                  {a.comment && !a.ai_summary && <Button size="sm" variant="ghost" onClick={() => analyze(a.id)} className="ml-auto"><Sparkles className="h-3 w-3 mr-1" /> Analisar</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
          {answers.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma resposta ainda.</p>}

          {total > pageSize && (
            <div className="flex items-center justify-between pt-3 text-sm">
              <span className="text-muted-foreground">
                Página {page + 1} de {totalPages} · {total} resposta(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

