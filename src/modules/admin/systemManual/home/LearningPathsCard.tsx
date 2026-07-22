import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Route, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Progress } from '@/ui/base/progress';
import { MANUAL_MODULES } from '../content';
import { LEARNING_PATHS } from '../paths';

export function LearningPathsCard({ isDone }: { isDone: (slug: string) => boolean }) {
  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="h-5 w-5 text-primary" /> Trilhas de aprendizado por perfil
        </CardTitle>
        <CardDescription>
          Não sabe por onde começar? Escolha o perfil que mais se aproxima do seu papel e siga a trilha na ordem.
          Cada trilha entrega um resultado concreto ao final.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {LEARNING_PATHS.map((path) => {
            const PIcon = path.icon;
            const doneInPath = path.modules.filter((s) => isDone(s)).length;
            const pathPct = Math.round((doneInPath / path.modules.length) * 100);
            return (
              <div key={path.id} className="rounded-lg border bg-muted/20 p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border ${path.color}`}>
                    <PIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{path.title}</p>
                    <p className="text-xs text-muted-foreground">{path.persona}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                    {doneInPath}/{path.modules.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{path.description}</p>
                <Progress value={pathPct} className="h-1.5 mb-3" />
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {path.modules.map((slug, idx) => {
                    const m = MANUAL_MODULES.find((x) => x.slug === slug);
                    if (!m) return null;
                    const done = isDone(slug);
                    return (
                      <Link key={slug} to={`/admin/manual/${slug}`}>
                        <Badge
                          variant="outline"
                          className={`text-[10px] gap-1 ${done ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' : ''}`}
                        >
                          {done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3 opacity-40" />}
                          {idx + 1}. {m.title}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground border-t pt-2">
                  <Trophy className="h-3 w-3 inline mr-1 text-amber-500" />
                  <strong>Resultado:</strong> {path.outcome}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
