import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { MANUAL_MODULES, MANUAL_CATEGORIES, getDifficulty, getBeginner, DIFFICULTY_STYLE } from '../content';

type Module = (typeof MANUAL_MODULES)[number];

export function ModulesGrid({
  modules,
  isDone,
  query,
}: {
  modules: Module[];
  isDone: (slug: string) => boolean;
  query: string;
}) {
  return (
    <>
      <div className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Manuais por módulo
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          const catStyle = MANUAL_CATEGORIES[m.category];
          const difficulty = getDifficulty(m.slug);
          const beg = getBeginner(m.slug);
          const completed = isDone(m.slug);
          return (
            <Link
              key={m.slug}
              to={`/admin/manual/${m.slug}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <Card className={`h-full transition-all hover:shadow-elevation-3 hover:-translate-y-0.5 ${completed ? 'border-green-500/40 bg-green-500/[0.02]' : 'hover:border-primary/50'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-inset ring-primary/20 relative">
                      <Icon className="h-5 w-5" />
                      {completed && (
                        <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-background">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </span>
                      )}
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
                      {completed ? 'Revisar' : 'Abrir guia'} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {modules.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum módulo encontrado para "{query}".
          </CardContent>
        </Card>
      )}
    </>
  );
}
