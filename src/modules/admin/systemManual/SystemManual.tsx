import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, GraduationCap, Sparkles, Map, CheckCircle2, Clock, Users } from 'lucide-react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/ui/base/accordion';
import { MANUAL_MODULES, MANUAL_CATEGORIES, getDifficulty, getBeginner, DIFFICULTY_STYLE } from './content';
import { IMPLEMENTATION_ROADMAP } from './foundation';
import manualIcon from './assets/manual-icon.png';

export default function SystemManual() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return MANUAL_MODULES.filter((m) => {
      if (cat !== 'all' && m.category !== cat) return false;
      if (!t) return true;
      return (
        m.title.toLowerCase().includes(t) ||
        m.short.toLowerCase().includes(t) ||
        m.category.toLowerCase().includes(t)
      );
    });
  }, [q, cat]);

  const categories = Object.keys(MANUAL_CATEGORIES) as (keyof typeof MANUAL_CATEGORIES)[];

  return (
    <PageContainer>
      <PageHeader
        title="Manual do Sistema"
        description="Treinamento completo para implantação e uso diário. Escolha um módulo para ver instruções passo a passo, boas práticas, FAQ e troubleshooting."
        icon={GraduationCap}
      />

      <Card className="mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Um manual pensado para quem nunca usou um ERP
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Cada módulo tem uma aba <strong>👋 Para leigos</strong> com linguagem simples, uma analogia do dia a dia,
              os primeiros passos em português claro e um mini-dicionário. Se você é novo por aqui, comece pelos módulos
              marcados como <Badge variant="outline" className={DIFFICULTY_STYLE.Iniciante}>Iniciante</Badge>.
            </CardDescription>
          </CardHeader>
          <div className="pr-6 pb-6 md:pb-0 md:pr-8 hidden md:block">
            <img
              src={manualIcon}
              alt="Manual do sistema — livro aberto com lâmpada"
              width={140}
              height={140}
              loading="lazy"
              className="drop-shadow-xl"
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo, categoria ou palavra-chave..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={cat === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCat('all')}>
            Todos ({MANUAL_MODULES.length})
          </Button>
          {categories.map((c) => {
            const count = MANUAL_MODULES.filter((m) => m.category === c).length;
            return (
              <Button key={c} variant={cat === c ? 'default' : 'outline'} size="sm" onClick={() => setCat(c)}>
                {c} ({count})
              </Button>
            );
          })}
        </div>
      </div>

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

      <div className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Manuais por módulo
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {filtered.map((m) => {
          const Icon = m.icon;
          const catStyle = MANUAL_CATEGORIES[m.category];
          const difficulty = getDifficulty(m.slug);
          const beg = getBeginner(m.slug);
          return (
            <Link
              key={m.slug}
              to={`/admin/manual/${m.slug}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <Card className="h-full transition-all hover:shadow-elevation-3 hover:border-primary/50 hover:-translate-y-0.5">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-inset ring-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={catStyle.color}>{m.category}</Badge>
                      <Badge variant="outline" className={`${DIFFICULTY_STYLE[difficulty]} text-[10px]`}>
                        {difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                    {m.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{beg.inPlainWords}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>⏱ {beg.timeToLearn}</span>
                    <span className="flex items-center gap-1 text-primary font-medium">
                      Abrir guia <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum módulo encontrado para "{q}".
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
