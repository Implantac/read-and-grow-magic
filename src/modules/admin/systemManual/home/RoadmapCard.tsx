import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Map, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { Badge } from '@/ui/base/badge';
import { MANUAL_MODULES } from '../content';
import { IMPLEMENTATION_ROADMAP } from '../foundation';

export function RoadmapCard() {
  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="h-5 w-5 text-primary" /> Roteiro cronológico de implantação
        </CardTitle>
        <CardDescription>
          A ordem correta para implantar um ERP. Cada fase tem entregável e critério de saída (gate). Não pule fases —
          um cadastro fraco na F2 vira problema fiscal na F4 e retrabalho na F9.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {IMPLEMENTATION_ROADMAP.map((phase) => (
            <AccordionItem key={phase.code} value={phase.code}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {phase.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{phase.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{phase.goal}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                    <Clock className="h-3 w-3 mr-1" /> {phase.duration}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 md:grid-cols-2 pt-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Atividades</p>
                    <ul className="space-y-1.5">
                      {phase.activities.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Responsável</p>
                      <p className="text-sm flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {phase.owner}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Entregável</p>
                      <p className="text-sm">{phase.deliverable}</p>
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5">
                      <p className="text-xs font-semibold uppercase text-primary mb-1">Gate (critério de saída)</p>
                      <p className="text-sm">{phase.gate}</p>
                    </div>
                    {phase.modules.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Módulos envolvidos</p>
                        <div className="flex flex-wrap gap-1">
                          {phase.modules.map((slug) => {
                            const m = MANUAL_MODULES.find((x) => x.slug === slug);
                            if (!m) return null;
                            return (
                              <Link key={slug} to={`/admin/manual/${slug}`}>
                                <Badge variant="secondary" className="text-[10px] hover:bg-primary hover:text-primary-foreground transition-colors">
                                  {m.title}
                                </Badge>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
