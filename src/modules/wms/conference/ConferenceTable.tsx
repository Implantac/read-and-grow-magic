import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/base/dropdown-menu';
import { MoreHorizontal, PlayCircle, CheckCircle, Eye, ScanBarcode } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { statusConfig } from './constants';

interface Props {
  loading: boolean;
  records: any[];
  onViewItems: (id: string, confType: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onFinalize: (id: string) => void;
}

export function ConferenceTable({ loading, records, onViewItems, onStart, onComplete, onFinalize }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ScanBarcode className="h-5 w-5" /> Conferências</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Divergências</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(rec => {
                const cfg = statusConfig[rec.status] || statusConfig.pending;
                return (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium font-mono">{rec.conferenceNumber}</TableCell>
                    <TableCell>{rec.referenceNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={rec.conferenceType === 'blind' ? 'destructive' : 'outline'}>
                        {rec.conferenceType === 'blind' ? 'Cega' : 'Normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>{rec.operator || '-'}</TableCell>
                    <TableCell className="tabular-nums">{rec.checkedItems}/{rec.totalItems}</TableCell>
                    <TableCell>
                      {rec.divergences > 0 ? (
                        <Badge variant="destructive">{rec.divergences}</Badge>
                      ) : rec.status === 'completed' ? (
                        <Badge variant="outline">0</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewItems(rec.id, rec.conferenceType)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver Itens
                          </DropdownMenuItem>
                          {rec.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onStart(rec.id)}>
                              <PlayCircle className="mr-2 h-4 w-4" /> Iniciar
                            </DropdownMenuItem>
                          )}
                          {rec.status === 'in_progress' && (
                            <DropdownMenuItem onClick={() => onComplete(rec.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Concluir
                            </DropdownMenuItem>
                          )}
                          {rec.referenceType === 'receiving' && (rec.status === 'in_progress' || rec.status === 'divergence' || rec.status === 'completed') && (
                            <DropdownMenuItem onClick={() => onFinalize(rec.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Lançar no Ledger
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState compact icon={ScanBarcode} title="Sem conferências" description="Nenhuma conferência encontrada com os filtros atuais." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
