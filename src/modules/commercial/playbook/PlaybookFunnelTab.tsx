import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { CheckCircle2, Clock, Copy, MessageSquare, Target } from 'lucide-react';
import { FUNNEL_STAGES } from '@/hooks/commercial/useSalesFunnel';

interface Props {
  playbooks: any[];
  loading: boolean;
  selectedStage: string;
  setSelectedStage: (s: string) => void;
  onCopy: (text: string, playbookId?: string) => void;
}

export function PlaybookFunnelTab({ playbooks, loading, selectedStage, setSelectedStage, onCopy }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge
          variant={selectedStage === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedStage('all')}
        >
          Todas
        </Badge>
        {FUNNEL_STAGES.map((s) => (
          <Badge
            key={s.value}
            variant={selectedStage === s.value ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedStage(s.value)}
          >
            {s.label}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando playbooks...</div>
      ) : playbooks.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum playbook para esta etapa.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {playbooks.map((pb) => (
            <Card key={pb.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pb.title}</CardTitle>
                  <Badge variant="secondary">{FUNNEL_STAGES.find((s) => s.value === pb.stage)?.label || pb.stage}</Badge>
                </div>
                {pb.ideal_timing && (
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Timing ideal: {pb.ideal_timing}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {pb.scripts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-primary" /> Scripts
                    </h4>
                    <div className="space-y-2">
                      {pb.scripts.map((s: string, i: number) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm relative group">
                          <p className="pr-8 italic">"{s}"</p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-7"
                            onClick={() => onCopy(s, pb.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pb.actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Ações
                    </h4>
                    <ul className="space-y-1">
                      {pb.actions.map((a: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span> {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pb.next_steps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <Target className="h-4 w-4 text-blue-500" /> Próximos Passos
                    </h4>
                    <ul className="space-y-1">
                      {pb.next_steps.map((n: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">→</span> {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pb.tips && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-sm text-amber-700 dark:text-amber-400">💡 {pb.tips}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
