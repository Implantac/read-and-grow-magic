import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { ShoppingCart } from 'lucide-react';
import { formatBRL, formatNumber } from '@/lib/formatters';
import type { MaterialNeed } from './types';

interface Props {
  materialNeeds: MaterialNeed[];
  supplies: any[];
  generatingPO: boolean;
  onGenerate: () => void;
}

export function MRPPurchaseTab({ materialNeeds, supplies, generatingPO, onGenerate }: Props) {
  const deficits = materialNeeds.filter(m => m.deficit > 0);
  const totalCost = deficits.reduce((s, m) => {
    const supply = supplies.find(su => su.code === m.materialCode || su.name === m.materialName);
    return s + m.deficit * (supply?.unit_cost || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Sugestão de Compra
          </CardTitle>
          {deficits.length > 0 && (
            <Button size="sm" onClick={onGenerate} disabled={generatingPO}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {generatingPO ? 'Gerando...' : 'Gerar Pedido de Compra'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {deficits.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Todos os materiais possuem cobertura suficiente. Nenhuma compra sugerida.</p>
        ) : (
          <>
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de itens faltantes: <strong className="text-foreground">{deficits.length}</strong></span>
                <span className="text-muted-foreground">Custo estimado total: <strong className="text-foreground">{formatBRL(totalCost)}</strong></span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qtd. a Comprar</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Custo Est.</TableHead>
                  <TableHead>Urgência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deficits.map(m => {
                  const supply = supplies.find(s => s.code === m.materialCode || s.name === m.materialName);
                  const estCost = m.deficit * (supply?.unit_cost || 0);
                  return (
                    <TableRow key={m.materialCode}>
                      <TableCell className="font-medium">{m.materialName}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{formatNumber(m.deficit)}</TableCell>
                      <TableCell>{m.unit}</TableCell>
                      <TableCell>{m.supplier || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-right">R$ {formatNumber(estCost, 2)}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'critical' ? 'destructive' : 'secondary'}>
                          {m.status === 'critical' ? 'Urgente' : 'Normal'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
