import { Lightbulb, ListChecks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';

export function StepsTab({ manual }: { manual: any }) {
  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" /> Passo a passo de uso
          </CardTitle>
          <CardDescription>Siga na ordem para o fluxo padrão de operação.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {manual.steps.map((step: any, i: number) => (
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
    </div>
  );
}
