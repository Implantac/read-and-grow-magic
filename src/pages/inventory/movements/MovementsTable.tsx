import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent } from '@/ui/base/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/base/table';
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatBRL } from '@/lib/formatters';
import { movementTypeConfig } from '@/config/inventory';
import type { MovementDirection, MovementType, StockMovement } from '@/types/inventory';

interface Props {
  rows: StockMovement[];
  onView: (m: StockMovement) => void;
}

const typeBadge = (type: MovementType) => {
  const c = movementTypeConfig.find((t) => t.value === type);
  return <Badge className={c?.color}>{c?.label}</Badge>;
};

const dirIcon = (d: MovementDirection) =>
  d === 'in' ? (
    <ArrowDownCircle className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowUpCircle className="h-4 w-4 text-red-600" />
  );

const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: ptBR });

export function MovementsTable({ rows, onView }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Custo Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <EmptyState
                    compact
                    icon={ArrowLeftRight}
                    title="Sem movimentações"
                    description="Nenhuma entrada ou saída encontrada com os filtros aplicados."
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{dirIcon(m.direction)}</TableCell>
                  <TableCell className="font-medium">{m.documentNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{m.productCode}</div>
                      <div className="text-xs text-muted-foreground">{m.productName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{typeBadge(m.type)}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={m.direction === 'in' ? 'text-green-600' : 'text-red-600'}>
                      {m.direction === 'in' ? '+' : '-'}
                      {m.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(m.unitCost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(m.totalCost)}</TableCell>
                  <TableCell>{m.operator}</TableCell>
                  <TableCell>{fmtDate(m.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onView(m)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
