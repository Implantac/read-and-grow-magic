import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt } from './ExecutiveKPICards';

interface Props {
  scenarios: any[];
}

export function ExecutiveScenariosTab({ scenarios }: Props) {
  const latestScenario = scenarios[0];

  if (!latestScenario) {
    return (
      <Card><CardContent className="p-8 text-center">
        <Layers className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground mb-2">Clique em "Cenários" para gerar projeções estratégicas</p>
        <p className="text-xs text-muted-foreground">Serão gerados cenários otimista, realista e pessimista para os próximos 3 meses</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { key: 'optimistic', label: '🟢 Otimista', color: 'border-emerald-500/50 bg-emerald-500/5', data: latestScenario.optimistic },
          { key: 'realistic', label: '🔵 Realista', color: 'border-blue-500/50 bg-blue-500/5', data: latestScenario.realistic },
          { key: 'pessimistic', label: '🔴 Pessimista', color: 'border-destructive/50 bg-destructive/5', data: latestScenario.pessimistic },
        ].map(s => (
          <Card key={s.key} className={cn('border-2', s.color)}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.data ? (
                <>
                  {s.data.revenue != null && <div><p className="text-xs text-muted-foreground">Receita</p><p className="text-lg font-bold">{fmt(s.data.revenue)}</p></div>}
                  {s.data.profit != null && <div><p className="text-xs text-muted-foreground">Lucro</p><p className="text-lg font-bold">{fmt(s.data.profit)}</p></div>}
                  {s.data.margin != null && <div><p className="text-xs text-muted-foreground">Margem</p><p className="text-lg font-bold">{s.data.margin}%</p></div>}
                  {s.data.description && <p className="text-xs text-muted-foreground">{s.data.description}</p>}
                  {s.data.key_actions?.map((a: string, i: number) => (
                    <p key={i} className="text-xs">• {a}</p>
                  ))}
                </>
              ) : <p className="text-xs text-muted-foreground">Dados indisponíveis</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      {latestScenario.recommendations && Array.isArray(latestScenario.recommendations) && latestScenario.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">📋 Recomendações Estratégicas</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {latestScenario.recommendations.map((r: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">• {r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
