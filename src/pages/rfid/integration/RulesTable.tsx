import { Pencil, Trash2, Settings2 } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';
import { Switch } from '@/ui/base/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { EVENT_TYPE_OPTIONS, actionConfig, type WMSRule } from './useRFIDWMSRules';

interface Props {
  rules: WMSRule[];
  loading: boolean;
  onEdit: (rule: WMSRule) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export function RulesTable({ rules, loading, onEdit, onRemove, onToggle }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />Regras de Integração</CardTitle>
        <CardDescription>Defina o que acontece no WMS quando um leitor RFID detectar uma tag</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Ativo</TableHead>
                <TableHead>Nome / Descrição</TableHead>
                <TableHead>Gatilho RFID</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Ação WMS</TableHead>
                <TableHead className="text-center">Prioridade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => {
                const cfg = actionConfig[rule.wmsAction] ?? { label: rule.wmsAction, color: 'text-foreground' };
                const evtLabel = EVENT_TYPE_OPTIONS.find(e => e.value === rule.triggerEventType)?.label ?? rule.triggerEventType;
                return (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Switch checked={rule.enabled} onCheckedChange={v => onToggle(rule.id, v)} />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{rule.name}</p>
                      {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{evtLabel}</Badge>
                      {rule.triggerReaderCode && (
                        <p className="text-xs text-muted-foreground mt-1">Leitor: {rule.triggerReaderCode}</p>
                      )}
                    </TableCell>
                    <TableCell>{rule.triggerZone ?? <span className="text-muted-foreground text-xs">Qualquer</span>}</TableCell>
                    <TableCell>
                      <span className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</span>
                      {rule.wmsTargetLocation && (<p className="text-xs text-muted-foreground">→ {rule.wmsTargetLocation}</p>)}
                      {rule.autoComplete && (<Badge variant="secondary" className="text-xs mt-1">Auto-concluir</Badge>)}
                    </TableCell>
                    <TableCell className="text-center">{rule.priority}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onRemove(rule.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma regra configurada. Clique em "Nova Regra" para começar.
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
