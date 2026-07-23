import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { EmptyState } from '@/shared/components/EmptyState';
import { GripVertical, Layers, Pencil, Plus, Trash2 } from 'lucide-react';

interface Props {
  steps: any[];
  onNew: () => void;
  onEdit: (s: any) => void;
  onDelete: (id: string) => void;
}

export function StepsCatalogTab({ steps, onNew, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" /> Fluxo Produtivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Nenhuma etapa cadastrada"
            description="Cadastre as etapas do fluxo produtivo (corte, costura, acabamento, etc.) para gerá-las automaticamente por OP."
            action={{ label: 'Nova Etapa', onClick: onNew, icon: Plus }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tempo Est.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((s) => (
                <TableRow key={s.id} className={!s.is_active ? 'opacity-50' : ''}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell>{s.sector || '-'}</TableCell>
                  <TableCell>{s.estimated_time_minutes} min</TableCell>
                  <TableCell><StatusBadge status={s.is_active ? 'active' : 'inactive'} type="client" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
