import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, TrendingDown, ArrowRight, RotateCcw, Plus, ArrowUpDown, Calendar } from 'lucide-react';
import { useWMSMovements } from '@/hooks/useWMSOperations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MovementType } from '@/types/wms';

const movementTypeConfig: Record<MovementType, { label: string; icon: React.ReactNode; color: string }> = {
  inbound: { label: 'Entrada', icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-600' },
  outbound: { label: 'Saída', icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-600' },
  transfer: { label: 'Transferência', icon: <ArrowRight className="h-4 w-4" />, color: 'text-blue-600' },
  adjustment: { label: 'Ajuste', icon: <RotateCcw className="h-4 w-4" />, color: 'text-amber-600' }
};

export default function WMSMovementsPage() {
  const { movements, loading, createMovement } = useWMSMovements();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_code: '', product_name: '', type: 'inbound',
    from_location: '', to_location: '', quantity: 0, reason: '', operator: '',
  });

  const filteredMovements = movements.filter(movement => {
    const matchesSearch =
      movement.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayCount = movements.filter(m => m.createdAt?.startsWith(todayStr)).length;
  const inboundCount = movements.filter(m => m.type === 'inbound').length;
  const outboundCount = movements.filter(m => m.type === 'outbound').length;
  const transferCount = movements.filter(m => m.type === 'transfer').length;

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Movimentações WMS"
        description="Registro e histórico de movimentações no armazém"
        actions={
          <div className="flex gap-2">
            <ExportButton
              data={filteredMovements as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'productCode', label: 'Código' },
                { key: 'productName', label: 'Produto' },
                { key: 'type', label: 'Tipo' },
                { key: 'fromLocation', label: 'Origem' },
                { key: 'toLocation', label: 'Destino' },
                { key: 'quantity', label: 'Quantidade' },
                { key: 'reason', label: 'Motivo' },
                { key: 'operator', label: 'Operador' },
                { key: 'createdAt', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
              ]}
              filename="movimentacoes_wms"
            />
            <Button onClick={() => setIsFormOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Movimentação</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Hoje" value={todayCount} description="Movimentações" icon={Calendar} index={0} />
        <KPICard title="Entradas" value={inboundCount} icon={TrendingUp} index={1} color="success" />
        <KPICard title="Saídas" value={outboundCount} icon={TrendingDown} index={2} color="danger" />
        <KPICard title="Transferências" value={transferCount} icon={ArrowRight} index={3} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por produto, código ou motivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="inbound">Entrada</SelectItem>
                <SelectItem value="outbound">Saída</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Histórico de Movimentações
            {movements.length > 0 && <Badge variant="secondary" className="ml-2">Integrado com ERP</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada</TableCell>
                </TableRow>
              ) : filteredMovements.map((m) => {
                const config = movementTypeConfig[m.type as MovementType];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm">{format(new Date(m.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1 ${config?.color || ''}`}>
                        {config?.icon}{config?.label || m.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.productName}</div>
                      <div className="text-xs text-muted-foreground">{m.productCode}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.fromLocation || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.toLocation || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{m.quantity}</TableCell>
                    <TableCell>{m.reason}</TableCell>
                    <TableCell>{m.operator || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nova Movimentação WMS</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Código do Produto</Label><Input value={formData.product_code} onChange={(e) => setFormData(p => ({ ...p, product_code: e.target.value }))} /></div>
              <div><Label>Nome do Produto</Label><Input value={formData.product_name} onChange={(e) => setFormData(p => ({ ...p, product_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Entrada</SelectItem>
                    <SelectItem value="outbound">Saída</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Quantidade</Label><Input type="number" value={formData.quantity} onChange={(e) => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Origem</Label><Input value={formData.from_location} onChange={(e) => setFormData(p => ({ ...p, from_location: e.target.value }))} /></div>
              <div><Label>Destino</Label><Input value={formData.to_location} onChange={(e) => setFormData(p => ({ ...p, to_location: e.target.value }))} /></div>
            </div>
            <div><Label>Motivo</Label><Input value={formData.reason} onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))} /></div>
            <div><Label>Operador</Label><Input value={formData.operator} onChange={(e) => setFormData(p => ({ ...p, operator: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              const ok = await createMovement(formData);
              if (ok) {
                setIsFormOpen(false);
                setFormData({ product_code: '', product_name: '', type: 'inbound', from_location: '', to_location: '', quantity: 0, reason: '', operator: '' });
              }
            }}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
