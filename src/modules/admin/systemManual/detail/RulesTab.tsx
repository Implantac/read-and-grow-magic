import { Clock, Lightbulb, Shield, Users } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { SEVERITY_LABEL, SEVERITY_STYLE } from './constants';

export function RulesTab({ foundation }: { foundation: any }) {
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" /> Regras de negócio
          </CardTitle>
          <CardDescription>
            As invariantes que o sistema aplica. Regras <strong className="text-rose-500">bloqueantes</strong> não podem ser
            contornadas — as de <strong className="text-amber-500">atenção</strong> exigem justificativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {foundation.businessRules.map((b: any, i: number) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-foreground">{b.rule}</p>
                  <Badge variant="outline" className={`${SEVERITY_STYLE[b.severity as keyof typeof SEVERITY_STYLE]} text-[10px] shrink-0`}>
                    {SEVERITY_LABEL[b.severity as keyof typeof SEVERITY_LABEL]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Por quê:</strong> {b.reason}</span>
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {foundation.routines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Rotina cronológica
            </CardTitle>
            <CardDescription>Ritual sugerido pelo consultor de implantação.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l-2 border-primary/20 space-y-4">
              {foundation.routines.map((r: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <p className="text-xs uppercase tracking-wide font-semibold text-primary">{r.when}</p>
                  <p className="text-sm text-foreground mt-1">{r.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3 inline mr-1" />
                    {r.responsible}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
