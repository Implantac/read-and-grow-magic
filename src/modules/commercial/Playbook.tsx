import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePlaybooks, useObjections, useLogPlaybookUsage, usePlaybookAdherence } from '@/hooks/commercial/usePlaybook';
import { FUNNEL_STAGES } from '@/hooks/commercial/useSalesFunnel';
import { BookOpen, MessageSquare, Target, CheckCircle2, Copy, ThumbsUp, Clock, Shield, TrendingUp, Users, Zap } from 'lucide-react';

import { formatDate } from '@/lib/formatters';
import { toastSuccess } from '@/lib/toastHelpers';
const objectionCategories = [
  { value: 'price', label: 'Preço', icon: '💰' },
  { value: 'stall', label: 'Enrolação', icon: '⏳' },
  { value: 'competitor', label: 'Concorrência', icon: '🏢' },
  { value: 'timing', label: 'Timing', icon: '📅' },
  { value: 'authority', label: 'Autoridade', icon: '👔' },
  { value: 'budget', label: 'Orçamento', icon: '💳' },
];

export default function PlaybookPage() {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const { data: playbooks = [], isLoading: loadingPB } = usePlaybooks(selectedStage === 'all' ? undefined : selectedStage);
  const { data: objections = [], isLoading: loadingObj } = useObjections();
  const { data: usageLogs = [] } = usePlaybookAdherence();
  const logUsage = useLogPlaybookUsage();
  const copyToClipboard = (text: string, playbookId?: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess('Copiado!', 'Script copiado para a área de transferência');
    if (playbookId) {
      logUsage.mutate({ playbook_id: playbookId, action_type: 'copy_script', context: text.slice(0, 50) });
    }
  };

  const markObjectionUsed = (objId: string) => {
    logUsage.mutate({ objection_id: objId, action_type: 'used_objection' });
    toastSuccess('✅ Registrado', 'Uso da resposta registrado com sucesso');
  };

  // Adherence stats
  const totalLogs = usageLogs.length;
  const uniqueUsers = new Set(usageLogs.map((l: any) => l.sales_rep_id || l.user_id)).size;

  const dailyRoutine = [
    { time: '08:00', task: 'Revisar pipeline e prioridades do dia', icon: Target },
    { time: '08:30', task: 'Verificar fila "O Que Fazer Hoje"', icon: Zap },
    { time: '09:00', task: 'Bloco de prospecção (leads novos)', icon: Users },
    { time: '10:30', task: 'Follow-ups de propostas enviadas', icon: MessageSquare },
    { time: '11:30', task: 'Reuniões de negociação agendadas', icon: Shield },
    { time: '14:00', task: 'Bloco de qualificação de oportunidades', icon: TrendingUp },
    { time: '15:30', task: 'Contatos de recuperação de clientes', icon: Users },
    { time: '16:30', task: 'Atualizar CRM e registrar atividades', icon: CheckCircle2 },
    { time: '17:00', task: 'Planejar próximo dia', icon: Clock },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="📘 Playbook Comercial"
        description="Guia completo de vendas — scripts, objeções, técnicas e rotina"
      />

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="funnel" className="gap-1"><BookOpen className="h-4 w-4" /> Por Etapa</TabsTrigger>
          <TabsTrigger value="objections" className="gap-1"><MessageSquare className="h-4 w-4" /> Objeções</TabsTrigger>
          <TabsTrigger value="closing" className="gap-1"><Target className="h-4 w-4" /> Fechamento</TabsTrigger>
          <TabsTrigger value="routine" className="gap-1"><Clock className="h-4 w-4" /> Rotina</TabsTrigger>
          <TabsTrigger value="adherence" className="gap-1"><TrendingUp className="h-4 w-4" /> Aderência</TabsTrigger>
        </TabsList>

        {/* === PLAYBOOK POR ETAPA DO FUNIL === */}
        <TabsContent value="funnel" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge
              variant={selectedStage === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedStage('all')}
            >
              Todas
            </Badge>
            {FUNNEL_STAGES.map(s => (
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

          {loadingPB ? (
            <div className="text-center py-8 text-muted-foreground">Carregando playbooks...</div>
          ) : playbooks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum playbook para esta etapa.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {playbooks.map(pb => (
                <Card key={pb.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pb.title}</CardTitle>
                      <Badge variant="secondary">{FUNNEL_STAGES.find(s => s.value === pb.stage)?.label || pb.stage}</Badge>
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
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><MessageSquare className="h-4 w-4 text-primary" /> Scripts</h4>
                        <div className="space-y-2">
                          {pb.scripts.map((s, i) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm relative group">
                              <p className="pr-8 italic">"{s}"</p>
                              <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-7" onClick={() => copyToClipboard(s, pb.id)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pb.actions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Ações</h4>
                        <ul className="space-y-1">
                          {pb.actions.map((a, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pb.next_steps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><Target className="h-4 w-4 text-blue-500" /> Próximos Passos</h4>
                        <ul className="space-y-1">
                          {pb.next_steps.map((n, i) => (
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
        </TabsContent>

        {/* === OBJEÇÕES === */}
        <TabsContent value="objections" className="space-y-4">
          {loadingObj ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {objectionCategories.map(cat => {
                const catObj = objections.filter(o => o.category === cat.value);
                if (catObj.length === 0) return null;
                return (
                  <AccordionItem key={cat.value} value={cat.value} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="font-semibold">{cat.label}</span>
                        <Badge variant="secondary" className="ml-2">{catObj.length}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {catObj.map(obj => (
                          <Card key={obj.id} className="border-l-4 border-l-destructive/50">
                            <CardContent className="pt-4 space-y-3">
                              <div>
                                <p className="font-medium text-destructive">🗣️ "{obj.objection}"</p>
                              </div>
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">✅ Resposta:</p>
                                <p className="text-sm">{obj.response}</p>
                              </div>
                              {obj.strategy && (
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">🎯 Estratégia:</p>
                                  <p className="text-sm">{obj.strategy}</p>
                                </div>
                              )}
                              {obj.context && (
                                <p className="text-xs text-muted-foreground">📌 {obj.context}</p>
                              )}
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(obj.response)}>
                                  <Copy className="h-3 w-3 mr-1" /> Copiar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => markObjectionUsed(obj.id)}>
                                  <ThumbsUp className="h-3 w-3 mr-1" /> Usei
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </TabsContent>

        {/* === FECHAMENTO === */}
        <TabsContent value="closing" className="space-y-4">
          {playbooks.filter(pb => pb.closing_techniques.length > 0).length === 0 && selectedStage !== 'all' ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione "Todas" para ver técnicas de fechamento.</CardContent></Card>
          ) : null}
          {(() => {
            const allPB = playbooks.length > 0 ? playbooks : [];
            const closingPBs = allPB.filter(pb => pb.closing_techniques.length > 0);
            if (closingPBs.length === 0) return (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Carregando técnicas de fechamento...
                  <Button variant="link" className="block mx-auto mt-2" onClick={() => setSelectedStage('all')}>
                    Ver todas as etapas
                  </Button>
                </CardContent>
              </Card>
            );
            return closingPBs.map(pb => (
              <Card key={pb.id} className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">🎯 {pb.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pb.closing_techniques.map((t, i) => (
                    <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 relative group">
                      <p className="text-sm pr-8">{t}</p>
                      <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 w-7" onClick={() => copyToClipboard(t as string, pb.id)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ));
          })()}
        </TabsContent>

        {/* === ROTINA DIÁRIA === */}
        <TabsContent value="routine" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📋 Rotina Diária do Vendedor de Alta Performance</CardTitle>
              <CardDescription>Siga esta rotina para maximizar sua produtividade e resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyRoutine.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="text-sm font-mono font-bold text-primary min-w-[50px]">{item.time}</div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{item.task}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-base">💡 Regras de Ouro</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>🔥 <strong>Regra dos 5 minutos:</strong> Responda leads em até 5 min. Após 30 min, a taxa de conversão cai 80%.</li>
                <li>📞 <strong>Regra 10-3-1:</strong> 10 contatos geram 3 conversas que geram 1 oportunidade real.</li>
                <li>📝 <strong>Sem CRM, não aconteceu:</strong> Registre TUDO. Dados são sua arma.</li>
                <li>🎯 <strong>Foco no ICP:</strong> Não perca tempo com quem não é seu cliente ideal.</li>
                <li>🔄 <strong>Follow-up é lei:</strong> 80% das vendas acontecem após o 5º contato.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ADERÊNCIA === */}
        <TabsContent value="adherence" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{totalLogs}</p>
                <p className="text-sm text-muted-foreground">Usos do Playbook</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-emerald-500">{uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Vendedores Ativos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-amber-500">
                  {totalLogs > 0 ? (totalLogs / Math.max(uniqueUsers, 1)).toFixed(1) : '0'}
                </p>
                <p className="text-sm text-muted-foreground">Média por Vendedor</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimos Usos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {usageLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum uso registrado ainda. Os vendedores começarão a aparecer aqui ao utilizar scripts e respostas.</p>
                ) : (
                  <div className="space-y-2">
                    {usageLogs.slice(0, 50).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/50">
                        <span>{log.action_type === 'copy_script' ? '📋 Script copiado' : '👍 Objeção utilizada'}</span>
                        <span className="text-muted-foreground text-xs">{formatDate(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
