import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EmptyState } from '@/shared/components/EmptyState';
import { Timer, Clock, Play, Pause, Eye, StopCircle, User, Wrench } from 'lucide-react';
import type { TimeEntryRow } from '@/hooks/system/useTimeEntries';
import { statusConfig, getElapsedTime } from './constants';

interface Props {
  entries: TimeEntryRow[];
  filteredEntries: TimeEntryRow[];
  onView: (e: TimeEntryRow) => void;
  onPause: (e: TimeEntryRow) => void;
  onResume: (e: TimeEntryRow) => void;
  onComplete: (e: TimeEntryRow) => void;
  onNew: () => void;
  onClearFilters: () => void;
}

export function TimeEntriesTable({ entries, filteredEntries, onView, onPause, onResume, onComplete, onNew, onClearFilters }: Props) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5" />Apontamentos de Produção</CardTitle></CardHeader>
      <CardContent>
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={Timer}
            title={entries.length === 0 ? 'Nenhum apontamento registrado' : 'Nenhum apontamento encontrado'}
            description={entries.length === 0
              ? 'Inicie um apontamento para acompanhar o tempo e a produção por operação.'
              : 'Ajuste a busca ou os filtros para localizar o apontamento desejado.'}
            action={entries.length === 0
              ? { label: 'Novo Apontamento', onClick: onNew, icon: Play }
              : { label: 'Limpar filtros', onClick: onClearFilters, variant: 'outline' }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Centro</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Produzido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const sc = statusConfig[entry.status] || statusConfig.completed;
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium font-mono text-sm">{entry.order_number}</TableCell>
                    <TableCell>{entry.operation_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1"><User className="h-3 w-3 text-muted-foreground" />{entry.operator}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1"><Wrench className="h-3 w-3 text-muted-foreground" />{entry.work_center || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{getElapsedTime(entry)}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 dark:text-green-400">{entry.produced_quantity}</span>
                      {entry.rejected_quantity > 0 && (<span className="text-destructive ml-1">/ -{entry.rejected_quantity}</span>)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant} className="gap-1">{sc.icon}{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onView(entry)}><Eye className="h-4 w-4" /></Button>
                        {entry.status === 'started' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => onPause(entry)}><Pause className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" onClick={() => onComplete(entry)}><StopCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                        {entry.status === 'paused' && (
                          <Button variant="outline" size="sm" onClick={() => onResume(entry)}><Play className="h-4 w-4" /></Button>
                        )}
                      </div>
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
