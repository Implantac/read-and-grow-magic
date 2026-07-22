import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Target, Database } from 'lucide-react';

export function LearningCards({ learning }: { learning: any }) {
  if (!learning) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Calibração da IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {learning.calibration.map((c: any) => (
            <div key={c.bucket} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-mono">{c.bucket} <span className="text-muted-foreground">({c.n})</span></span>
                <span>declarada {c.declared}% · real {c.actual}%</span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden flex">
                <div className="bg-primary/60" style={{ width: `${c.declared}%` }} />
                <div className="bg-green-500/70 -ml-px" style={{ width: `${Math.max(0, c.actual - c.declared)}%` }} />
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground pt-1">Barra azul = confiança declarada. Verde = quanto acima do declarado o real ficou.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Top memórias do Cérebro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {learning.topMemories.length === 0 && <p className="text-sm text-muted-foreground">Sem memórias ainda.</p>}
          {learning.topMemories.slice(0, 8).map((m: any) => (
            <div key={m.id} className="border-l-2 border-primary/40 pl-3 py-1">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px] uppercase">{m.category}</Badge>
                <span className="font-mono font-semibold">{m.key}</span>
                <span className="text-[10px] text-muted-foreground">imp. {m.importance}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {typeof m.value === 'string' ? m.value : JSON.stringify(m.value).slice(0, 200)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function RisksOpportunitiesCards({ riscos, oportunidades }: { riscos: any[]; oportunidades: any[] }) {
  if (riscos.length === 0 && oportunidades.length === 0) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">🔴 Riscos identificados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {riscos.length === 0 && <p className="text-sm text-muted-foreground">Sem riscos materiais.</p>}
          {riscos.map((r: any, i: number) => (
            <div key={i} className="text-sm border-l-2 border-destructive/60 pl-3 py-1">
              <div className="font-semibold">{r.titulo} <Badge variant="outline" className="text-[10px] ml-1">{r.impacto}</Badge></div>
              <div className="text-xs text-muted-foreground">→ {r.acao}</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">💡 Oportunidades</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {oportunidades.length === 0 && <p className="text-sm text-muted-foreground">Sem oportunidades destacadas.</p>}
          {oportunidades.map((o: any, i: number) => (
            <div key={i} className="text-sm border-l-2 border-green-500/60 pl-3 py-1">
              <div className="font-semibold">{o.titulo} {o.valor_estimado && <Badge variant="outline" className="text-[10px] ml-1">{o.valor_estimado}</Badge>}</div>
              <div className="text-xs text-muted-foreground">→ {o.acao}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
