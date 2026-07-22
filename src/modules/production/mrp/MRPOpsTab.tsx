import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Progress } from '@/ui/base/progress';
import { cn } from '@/lib/utils';
import type { MaterialNeed } from './types';

interface Props {
  activeOPs: any[];
  sheets: any[];
  materialNeeds: MaterialNeed[];
}

export function MRPOpsTab({ activeOPs, sheets, materialNeeds }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle>OPs Ativas × Materiais</CardTitle></CardHeader>
      <CardContent>
        {activeOPs.length === 0 ? (
          <EmptyState compact title="Nenhuma OP ativa" description="Libere ordens de produção para calcular necessidades." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OP</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd. Pendente</TableHead>
                <TableHead>Ficha Técnica</TableHead>
                <TableHead>Materiais</TableHead>
                <TableHead>Cobertura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOPs.map(op => {
                const sheet = sheets.find(s => s.product_code === op.product_code || s.product_id === op.product_id);
                const matCount = sheet ? (sheet.materials?.length || 0) : 0;
                const remaining = Math.max(0, op.quantity - op.produced_quantity);

                let opCoverage = 100;
                if (sheet && Array.isArray(sheet.materials)) {
                  sheet.materials.forEach((mat: any) => {
                    const code = mat.code || mat.componentCode || mat.material_code || '';
                    const need = materialNeeds.find(n => n.materialCode === code);
                    if (need && need.coveragePct < opCoverage) opCoverage = need.coveragePct;
                  });
                }

                return (
                  <TableRow key={op.id}>
                    <TableCell className="font-mono text-sm">{op.order_number}</TableCell>
                    <TableCell className="font-medium">{op.product_name}</TableCell>
                    <TableCell className="text-right">{remaining}</TableCell>
                    <TableCell>
                      {sheet ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">v{sheet.version}</Badge>
                      ) : (
                        <Badge variant="destructive">Sem ficha</Badge>
                      )}
                    </TableCell>
                    <TableCell>{matCount} itens</TableCell>
                    <TableCell>
                      {sheet ? (
                        <div className="flex items-center gap-2">
                          <Progress value={opCoverage} className="w-16 h-2" />
                          <span className={cn('text-xs font-bold', opCoverage < 100 ? 'text-destructive' : 'text-green-600')}>{opCoverage}%</span>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
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
