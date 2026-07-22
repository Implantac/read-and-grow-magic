import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, Users } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Separator } from '@/ui/base/separator';

export function ModuleSidebar({ manual }: { manual: any }) {
  return (
    <aside className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Atalhos do módulo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {manual.routes.map((r: any) => (
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
          {manual.personas.map((p: string) => (
            <Badge key={p} variant="secondary">{p}</Badge>
          ))}
        </CardContent>
      </Card>

      {manual.prerequisites.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Pré-requisitos</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {manual.prerequisites.map((p: string, i: number) => (
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
  );
}
