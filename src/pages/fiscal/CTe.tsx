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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Send, Ban, Plus } from 'lucide-react';
import { useCTes, useCreateCTe, useTransmitCTe, useCancelCTe } from '@/hooks/useCTe';
import { format } from 'date-fns';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  pending: 'outline',
  authorized: 'default',
  cancelled: 'destructive',
  rejected: 'destructive',
};

export default function CTePage() {
  const { data: ctes = [], isLoading } = useCTes();
  const createCTe = useCreateCTe();
  const transmit = useTransmitCTe();
  const cancel = useCancelCTe();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    carrier_name: '', carrier_document: '',
    sender_name: '', sender_document: '', sender_uf: 'SP',
    recipient_name: '', recipient_document: '', recipient_uf: 'RJ',
    origin_city: '', destination_city: '',
    cargo_value: 0, freight_value: 0, icms_rate: 12, modal: 'rodoviario',
  });

  const handleCreate = async () => {
    await createCTe.mutateAsync(form as any);
    setOpen(false);
  };

  const totals = ctes.reduce(
    (acc, c) => ({
      total: acc.total + Number(c.total),
      authorized: acc.authorized + (c.status === 'authorized' ? 1 : 0),
    }),
    { total: 0, authorized: 0 }
  );

  return (
    <PageContainer>
      <PageHeader
        title="CT-e — Conhecimento de Transporte"
        description="Emita CT-e vinculado a NF-e e transportadoras"
        icon={Truck}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo CT-e</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Novo CT-e</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Transportadora</Label><Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /></div>
                <div><Label>CNPJ Transportadora</Label><Input value={form.carrier_document} onChange={(e) => setForm({ ...form, carrier_document: e.target.value })} /></div>
                <div><Label>Remetente</Label><Input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} /></div>
                <div><Label>UF Origem</Label><Input value={form.sender_uf} onChange={(e) => setForm({ ...form, sender_uf: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>Destinatário</Label><Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
                <div><Label>UF Destino</Label><Input value={form.recipient_uf} onChange={(e) => setForm({ ...form, recipient_uf: e.target.value.toUpperCase() })} maxLength={2} /></div>
                <div><Label>Cidade Origem</Label><Input value={form.origin_city} onChange={(e) => setForm({ ...form, origin_city: e.target.value })} /></div>
                <div><Label>Cidade Destino</Label><Input value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })} /></div>
                <div><Label>Valor da Carga</Label><Input type="number" value={form.cargo_value} onChange={(e) => setForm({ ...form, cargo_value: Number(e.target.value) })} /></div>
                <div><Label>Valor do Frete</Label><Input type="number" value={form.freight_value} onChange={(e) => setForm({ ...form, freight_value: Number(e.target.value) })} /></div>
                <div><Label>Alíq. ICMS (%)</Label><Input type="number" value={form.icms_rate} onChange={(e) => setForm({ ...form, icms_rate: Number(e.target.value) })} /></div>
                <div>
                  <Label>Modal</Label>
                  <Select value={form.modal} onValueChange={(v) => setForm({ ...form, modal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rodoviario">Rodoviário</SelectItem>
                      <SelectItem value="aereo">Aéreo</SelectItem>
                      <SelectItem value="ferroviario">Ferroviário</SelectItem>
                      <SelectItem value="aquaviario">Aquaviário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createCTe.isPending} className="w-full">Criar CT-e</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Total CT-e</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{ctes.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Autorizados</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-primary">{totals.authorized}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Valor Total Frete</CardTitle></CardHeader><CardContent className="text-2xl font-bold">R$ {totals.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Conhecimentos de Transporte</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-8 text-center text-muted-foreground">Carregando…</div> : ctes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum CT-e cadastrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Número</TableHead><TableHead>Emissão</TableHead><TableHead>Transportadora</TableHead><TableHead>Origem→Destino</TableHead><TableHead className="text-right">Frete</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {ctes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.number}</TableCell>
                    <TableCell>{format(new Date(c.issue_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{c.carrier_name}</TableCell>
                    <TableCell className="text-sm">{c.sender_uf} → {c.recipient_uf}</TableCell>
                    <TableCell className="text-right">R$ {Number(c.freight_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Badge variant={statusVariant[c.status] || 'outline'}>{c.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      {c.status === 'draft' && <Button size="sm" variant="outline" onClick={() => transmit.mutate(c.id)}><Send className="h-3 w-3" /></Button>}
                      {c.status === 'authorized' && <Button size="sm" variant="ghost" onClick={() => { const r = prompt('Justificativa do cancelamento:'); if (r) cancel.mutate({ id: c.id, reason: r }); }}><Ban className="h-3 w-3" /></Button>}
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
