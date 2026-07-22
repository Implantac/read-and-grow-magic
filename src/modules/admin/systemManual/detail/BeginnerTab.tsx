import { BookOpen, CheckCircle2, Lightbulb, ListChecks, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';

export function BeginnerTab({ beginner }: { beginner: any }) {
  return (
    <div className="space-y-4 mt-4">
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
          <CardDescription>Se você nunca usou este módulo, comece por aqui. É só seguir a ordem.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {beginner.plainSteps.map((step: string, i: number) => (
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
            {beginner.glossary.map((g: any, i: number) => (
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
    </div>
  );
}
