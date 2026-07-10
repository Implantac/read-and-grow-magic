import { useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Lightbulb, AlertTriangle, HelpCircle, Users, ListChecks,
  ExternalLink, Camera, Video, BookOpen, Sparkles, Printer, Shield, Target, Clock,
  Gauge, Ban, Link2, XCircle,
} from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Separator } from '@/ui/base/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { MANUAL_MODULES, MANUAL_CATEGORIES, getBeginner, getDifficulty, DIFFICULTY_STYLE } from './content';
import { getFoundation } from './foundation';

const SEVERITY_STYLE: Record<'blocking' | 'warning' | 'info', string> = {
  blocking: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  info: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
};
const SEVERITY_LABEL: Record<'blocking' | 'warning' | 'info', string> = {
  blocking: 'Bloqueante',
  warning: 'Atenção',
  info: 'Informativo',
};

export default function ModuleManualDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const manual = useMemo(() => MANUAL_MODULES.find((m) => m.slug === slug), [slug]);

  if (!manual) {
    return (
      <PageContainer>
        <PageHeader title="Módulo não encontrado" description="Verifique o link ou volte para o índice do manual." icon={BookOpen} />
        <Button onClick={() => navigate('/admin/manual')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Manual
        </Button>
      </PageContainer>
    );
  }

  const Icon = manual.icon;
  const catStyle = MANUAL_CATEGORIES[manual.category];
  const beginner = getBeginner(manual.slug);
  const difficulty = getDifficulty(manual.slug);
  const foundation = getFoundation(manual.slug);

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/manual" className="hover:text-primary flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Manual do Sistema
        </Link>
        <span>/</span>
        <span className="text-foreground">{manual.title}</span>
      </div>

      <PageHeader
        title={manual.title}
        description={manual.short}
        icon={Icon}
        actions={
          <>
            <Badge variant="outline" className={catStyle.color}>{manual.category}</Badge>
            <Badge variant="outline" className={DIFFICULTY_STYLE[difficulty]}>{difficulty}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">⏱ {beginner.timeToLearn}</Badge>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          <Tabs defaultValue="beginner">
            <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full">
              <TabsTrigger value="beginner">👋 Leigos</TabsTrigger>
              <TabsTrigger value="foundation">🎯 Fundamentos</TabsTrigger>
              <TabsTrigger value="rules">📏 Regras</TabsTrigger>
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="steps">Passo a passo</TabsTrigger>
              <TabsTrigger value="media">Telas & vídeos</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="trouble">Problemas</TabsTrigger>
            </TabsList>

            <TabsContent value="beginner" className="space-y-4 mt-4">
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" /> Sem enrolação: o que este módulo faz
                  </CardTitle>
                  <CardDescription className="text-base text-foreground/90 pt-2">
                    {beginner.inPlainWords}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
                          Uma analogia para entender rápido
                        </p>
                        <p className="text-sm text-foreground/90">{beginner.analogy}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4 text-primary" /> Os primeiros passos, em português claro
                  </CardTitle>
                  <CardDescription>
                    Se você nunca usou este módulo, comece por aqui. É só seguir a ordem.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {beginner.plainSteps.map((step, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {i + 1}
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-4 w-4 text-primary" /> Palavras difíceis, traduzidas
                  </CardTitle>
                  <CardDescription>Um mini-dicionário só para este módulo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    {beginner.glossary.map((g, i) => (
                      <div key={i} className="grid sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 pb-3 border-b last:border-0 last:pb-0">
                        <dt className="text-sm font-semibold text-primary">{g.term}</dt>
                        <dd className="text-sm text-muted-foreground">{g.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Se travar, respire fundo.</p>
                  <p className="text-muted-foreground mt-1">
                    Nada aqui apaga dados por engano — mudanças críticas sempre pedem confirmação. Explore à vontade,
                    e use a aba <strong>Problemas</strong> se algo parecer estranho.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" /> O que é este módulo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  {manual.overview.map((p, i) => <p key={i}>{p}</p>)}
                </CardContent>
              </Card>

              {manual.sections.length > 0 && (
                <div className="space-y-4">
                  {manual.sections.map((s, i) => (
                    <Card key={i}>
                      <CardHeader><CardTitle className="text-base">{s.heading}</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                        {s.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="steps" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="h-4 w-4 text-primary" /> Passo a passo de uso
                  </CardTitle>
                  <CardDescription>Siga na ordem para o fluxo padrão de operação.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {manual.steps.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-foreground">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          {step.tip && (
                            <div className="mt-2 flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs">
                              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                              <span className="text-amber-700 dark:text-amber-300">{step.tip}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Video className="h-4 w-4 text-primary" /> Vídeo de operação
                  </CardTitle>
                  <CardDescription>
                    Grave um vídeo curto (2–5 min) navegando as telas reais e vincule aqui. Use ferramentas como Loom,
                    Zight ou OBS.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {manual.videoUrl ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={manual.videoUrl}
                        title={`Vídeo — ${manual.title}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Video className="h-10 w-10 opacity-40" />
                      <p className="text-sm">Vídeo ainda não vinculado</p>
                      <p className="text-xs">Edite este módulo em <code>content.ts</code> e defina <code>videoUrl</code>.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {manual.screenshots && manual.screenshots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Camera className="h-4 w-4 text-primary" /> Capturas de tela sugeridas
                    </CardTitle>
                    <CardDescription>
                      Recomendações de prints para ilustrar o treinamento. Substitua os placeholders por imagens reais da
                      sua operação.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {manual.screenshots.map((s, i) => (
                        <div key={i} className="rounded-lg border border-dashed border-border p-4 bg-muted/20">
                          <div className="aspect-video bg-muted/50 rounded flex items-center justify-center mb-3">
                            <Camera className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                          <h5 className="font-medium text-sm">{s.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="faq" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="h-4 w-4 text-primary" /> Perguntas frequentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {manual.faq.map((f, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trouble" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Solução de problemas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {manual.troubleshooting.map((t, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{t.problem}</p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            {t.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Atalhos do módulo</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {manual.routes.map((r) => (
                <Link
                  key={r.path}
                  to={r.path}
                  className="flex items-center justify-between text-sm rounded-md px-3 py-2 hover:bg-muted transition-colors group"
                >
                  <span className="truncate">{r.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> Perfis recomendados
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {manual.personas.map((p) => (
                <Badge key={p} variant="secondary">{p}</Badge>
              ))}
            </CardContent>
          </Card>

          {manual.prerequisites.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Pré-requisitos</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {manual.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground px-1">
            <p className="font-medium text-foreground mb-1">💡 Dica de implantador</p>
            <p>
              Combine este manual com sessões práticas em sandbox. Cada persona deve executar ao menos um ciclo completo
              antes de operar em produção.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
