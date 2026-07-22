import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { priorityConfig } from '@/config/production';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { formatNumber } from '@/lib/formatters';

export function DemandTab({ orders, onGenerate }: { orders: any[]; onGenerate: (order: any) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Pedidos Aguardando Produção</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Nº Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Itens</TableHead>
            <TableHead>Total</TableHead><TableHead>Entrega</TableHead><TableHead>Prioridade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido aguardando produção</TableCell></TableRow>
            ) : orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono">{o.number}</TableCell>
                <TableCell>{o.client_name}</TableCell>
                <TableCell>{o.items?.length || 0} itens</TableCell>
                <TableCell>R$ {formatNumber(o.total, 2)}</TableCell>
                <TableCell>{o.delivery_date ? format(new Date(o.delivery_date), 'dd/MM/yyyy') : '-'}</TableCell>
                <TableCell><Badge className={cn('text-xs', priorityConfig[o.priority]?.color)}>{priorityConfig[o.priority]?.label || o.priority}</Badge></TableCell>
                <TableCell className="text-right"><Button size="sm" onClick={() => onGenerate(o)}><Plus className="h-3 w-3 mr-1" /> Gerar OP</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
