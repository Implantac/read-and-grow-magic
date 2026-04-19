import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Calculator } from 'lucide-react';
import { useTaxRules, useUpsertTaxRule, useDeleteTaxRule, type TaxRule } from '@/hooks/useTaxRules';

const empty: Partial<TaxRule> = {
  name: '',
  ncm: '',
  cfop: '',
  operation_type: 'saida',
  tax_regime: 'simples',
  icms_cst: '102',
  icms_rate: 0,
  pis_cst: '01',
  pis_rate: 0,
  cofins_cst: '01',
  cofins_rate: 0,
  ipi_cst: '50',
  ipi_rate: 0,
  priority: 100,
  active: true,
};

export default function TaxRulesPage() {
  const { data: rules = [], isLoading } = useTaxRules();
  const upsert = useUpsertTaxRule();
  const del = useDeleteTaxRule();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<TaxRule>>(empty);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return rules.filter(
      (r) =>
        !s ||
        r.name.toLowerCase().includes(s) ||
        r.ncm?.toLowerCase().includes(s) ||
        r.cfop?.toLowerCase().includes(s)
    );
  }, [rules, search]);

  const openNew = () => {
    setEditing(empty);
    setOpen(true);
  };
  const openEdit = (r: TaxRule) => {
    setEditing(r);
    setOpen(true);
  };
  const save = async () => {
    if (!editing.name) return;
    await upsert.mutateAsync(editing as any);
    setOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Regras Fiscais"
        description="Cadastro de regras de tributação por NCM, CFOP e regime"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, NCM ou CFOP..."
            className="pl-9"
          />
        </div>
        <Button size="lg" onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Regra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras cadastradas ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>NCM</TableHead>
                <TableHead>CFOP</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead className="text-right">ICMS</TableHead>
                <TableHead className="text-right">PIS</TableHead>
                <TableHead className="text-right">COFINS</TableHead>
                <TableHead className="text-right">IPI</TableHead>
                <TableHead className="text-center">Prior.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    Nenhuma regra cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.ncm || '—'}</TableCell>
                    <TableCell>{r.cfop || '—'}</TableCell>
                    <TableCell className="capitalize">{r.tax_regime}</TableCell>
                    <TableCell className="text-right">{Number(r.icms_rate).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.pis_rate).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.cofins_rate).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{Number(r.ipi_rate).toFixed(2)}%</TableCell>
                    <TableCell className="text-center">{r.priority}</TableCell>
                    <TableCell>
                      <Badge variant={r.active ? 'default' : 'secondary'}>
                        {r.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remover regra "${r.name}"?`)) del.mutate(r.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Editar' : 'Nova'} Regra Fiscal</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <Label>NCM (opcional)</Label>
              <Input
                value={editing.ncm || ''}
                onChange={(e) => setEditing({ ...editing, ncm: e.target.value })}
              />
            </div>
            <div>
              <Label>CFOP (opcional)</Label>
              <Input
                value={editing.cfop || ''}
                onChange={(e) => setEditing({ ...editing, cfop: e.target.value })}
              />
            </div>
            <div>
              <Label>Regime</Label>
              <Select
                value={editing.tax_regime}
                onValueChange={(v) => setEditing({ ...editing, tax_regime: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operação</Label>
              <Select
                value={editing.operation_type}
                onValueChange={(v) => setEditing({ ...editing, operation_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ICMS CST</Label>
              <Input
                value={editing.icms_cst || ''}
                onChange={(e) => setEditing({ ...editing, icms_cst: e.target.value })}
              />
            </div>
            <div>
              <Label>ICMS %</Label>
              <Input
                type="number"
                step="0.01"
                value={editing.icms_rate ?? 0}
                onChange={(e) => setEditing({ ...editing, icms_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>PIS %</Label>
              <Input
                type="number"
                step="0.01"
                value={editing.pis_rate ?? 0}
                onChange={(e) => setEditing({ ...editing, pis_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>COFINS %</Label>
              <Input
                type="number"
                step="0.01"
                value={editing.cofins_rate ?? 0}
                onChange={(e) => setEditing({ ...editing, cofins_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>IPI %</Label>
              <Input
                type="number"
                step="0.01"
                value={editing.ipi_rate ?? 0}
                onChange={(e) => setEditing({ ...editing, ipi_rate: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Prioridade</Label>
              <Input
                type="number"
                value={editing.priority ?? 100}
                onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch
                checked={editing.active ?? true}
                onCheckedChange={(v) => setEditing({ ...editing, active: v })}
              />
              <Label>Regra ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!editing.name || upsert.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
