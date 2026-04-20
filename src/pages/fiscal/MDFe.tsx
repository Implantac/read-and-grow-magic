import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PackageCheck, Send, CheckSquare, Plus } from 'lucide-react';
import { useMDFes, useCreateMDFe, useTransmitMDFe, useCloseMDFe } from '@/hooks/useMDFe';
import { format } from 'date-fns';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending: 'outline',
  authorized: 'default',
  closed: 'outline',
  cancelled: 'destructive',
};

export default function MDFePage() {
  const { data: mdfes = [], isLoading } = useMDFes();
  const create = useCreateMDFe();
  const transmit = useTransmitMDFe();
  const close = useCloseMDFe();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    uf_origin: 'SP', uf_destination: 'RJ', loading_city: '',
    vehicle_plate: '', vehicle_uf: 'SP', driver_name: '', driver_cpf: '',
  });

  const handleCreate = async () => {
    await create.mutateAsync(form as any);
    setOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="MDF-e — Manifesto de Documentos Fiscais"
        description="Agrupe NF-e/CT-e por viagem e encerre automaticamente ao final"
        icon={PackageCheck}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo MDF-e</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Novo MDF-e</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>UF Origem</Label><Input value={form.uf_origin} onChange={(e) => setForm({ ...form, uf_origin: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>UF Destino</Label><Input value={form.uf_destination} onChange={(e) => setForm({ ...form, uf_destination: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div className="col-span-2"><Label>Cidade de Carregamento</Label><Input value={form.loading_city} onChange={(e) => setForm({ ...form, loading_city: e.target.value })} /></div>
                <div><Label>Placa do Veículo</Label><Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })} /></div>
                <div><Label>UF Veículo</Label><Input value={form.vehicle_uf} onChange={(e) => setForm({ ...form, vehicle_uf: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>Motorista</Label><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></div>
                <div><Label>CPF Motorista</Label><Input value={form.driver_cpf} onChange={(e) => setForm({ ...form, driver_cpf: e.target.value })} /></div>
              </div>
              <Button onClick={handleCreate} disabled={create.isPending} className="w-full">Criar MDF-e</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total MDF-e</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{mdfes.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Em Trânsito</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-primary">{mdfes.filter(m => m.status === 'authorized').length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Encerrados</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{mdfes.filter(m => m.status === 'closed').length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Manifestos</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Carregando…</div> : mdfes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum MDF-e cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Número</TableHead><TableHead>Emissão</TableHead><TableHead>Rota</TableHead><TableHead>Veículo</TableHead><TableHead>Motorista</TableHead><TableHead className="text-right">Docs</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {mdfes.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.number}</TableCell>
                    <TableCell>{format(new Date(m.issue_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-sm">{m.uf_origin} → {m.uf_destination}</TableCell>
                    <TableCell>{m.vehicle_plate || '-'}</TableCell>
                    <TableCell>{m.driver_name || '-'}</TableCell>
                    <TableCell className="text-right">{m.total_documents}</TableCell>
                    <TableCell><Badge variant={statusVariant[m.status] || 'outline'}>{m.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      {m.status === 'draft' && <Button size="sm" variant="outline" onClick={() => transmit.mutate(m.id)}><Send className="h-3 w-3" /></Button>}
                      {m.status === 'authorized' && <Button size="sm" variant="outline" onClick={() => close.mutate(m.id)}><CheckSquare className="h-3 w-3 mr-1" />Encerrar</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
