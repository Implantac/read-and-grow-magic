import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { formatBRL } from '@/lib/formatters';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useBankReconcileEngine } from '@/hooks/financial/useBankReconcileEngine';

export function AutoReconcilePanel() {
  const { suggestions, loading, running, runAuto, accept, reject } = useBankReconcileEngine();

  return (
    <Card className="mt-6 shadow-lg border-primary/10">
      <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Motor de Conciliação Automática
          </CardTitle>
          <CardDescription>
            Auto-concilia score ≥ 70 e lista sugestões (40–69) para revisão humana.
          </CardDescription>
        </div>
        <Button onClick={() => runAuto()} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {running ? 'Processando…' : 'Rodar auto-conciliação'}
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
        ) : suggestions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Nenhuma sugestão pendente. Rode o motor para gerar novas.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Score</TableHead>
                <TableHead>Transação bancária</TableHead>
                <TableHead>Lançamento candidato</TableHead>
                <TableHead className="text-right">Δ dias</TableHead>
                <TableHead className="text-right">Sim. desc.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => {
                const bd = (s.score_breakdown || {}) as any;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Badge variant={s.score >= 60 ? 'default' : 'secondary'}>{Number(s.score).toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.bank_transaction_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">
                      {bd.candidate_date || '—'} · {formatBRL(Number(bd.candidate_amount || 0))}
                    </TableCell>
                    <TableCell className="text-right">{bd.date != null ? (25 - Number(bd.date)) : '—'}</TableCell>
                    <TableCell className="text-right">
                      {bd.description_similarity != null ? `${(Number(bd.description_similarity) * 100).toFixed(0)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => accept(s.id)}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => reject(s.id)}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
