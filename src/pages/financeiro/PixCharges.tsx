import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, Plus, Copy, CheckCircle2, Clock, Zap } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { usePixCharges, useCreatePixCharge, useSimulatePixPayment } from '@/hooks/usePixCharges';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusMeta = {
  pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
  paid: { label: 'Pago', variant: 'default' as const, icon: CheckCircle2 },
  expired: { label: 'Expirado', variant: 'outline' as const, icon: Clock },
  cancelled: { label: 'Cancelado', variant: 'outline' as const, icon: Clock },
  refunded: { label: 'Reembolsado', variant: 'outline' as const, icon: Clock },
};

export default function PixCharges() {
  const { data: charges = [], isLoading } = usePixCharges();
  const create = useCreatePixCharge();
  const simulate = useSimulatePixPayment();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', client_name: '', description: '' });

  const totals = {
    pending: charges.filter(c => c.status === 'pending').length,
    pendingAmount: charges.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0),
    paid: charges.filter(c => c.status === 'paid').length,
    paidAmount: charges.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0),
  };

  const submit = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast({ title: 'Valor inválido', variant: 'destructive' });
    await create.mutateAsync({ amount: amt, client_name: form.client_name || undefined, description: form.description || undefined });
    setOpen(false);
    setForm({ amount: '', client_name: '', description: '' });
  };

  return (
    <PageContainer>
      <PageHeader title="Cobranças PIX" description="Gere e acompanhe pagamentos PIX em tempo real">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova cobrança</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova cobrança PIX</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Cliente</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={create.isPending}>Gerar QR Code</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Pendentes" value={totals.pending} subtitle={fmtBRL(totals.pendingAmount)} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Pagos" value={totals.paid} subtitle={fmtBRL(totals.paidAmount)} icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Total cobranças" value={charges.length} subtitle="últimos 200 registros" icon={<QrCode className="h-5 w-5" />} accentColor="primary" index={2} />
        <KPICard title="Taxa conversão" value={`${charges.length ? Math.round((totals.paid / charges.length) * 100) : 0}%`} subtitle="pagas / geradas" icon={<Zap className="h-5 w-5" />} accentColor="primary" index={3} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Cobranças recentes</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criada</TableHead>
                  <TableHead>TXID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : charges.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma cobrança ainda. Gere a primeira!</TableCell></TableRow>
                ) : charges.map(c => {
                  const m = statusMeta[c.status];
                  const Icon = m.icon;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(c.created_at), 'dd/MM HH:mm', { locale: ptBR })}</TableCell>
                      <TableCell className="font-mono text-xs">{c.txid?.slice(0, 12)}...</TableCell>
                      <TableCell className="text-sm">{c.client_name ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">{fmtBRL(Number(c.amount))}</TableCell>
                      <TableCell><Badge variant={m.variant} className="gap-1"><Icon className="h-3 w-3" />{m.label}</Badge></TableCell>
                      <TableCell className="text-xs">{c.paid_at ? format(new Date(c.paid_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {c.copy_paste && (
                            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.copy_paste!); toast({ title: 'PIX copiado' }); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          {c.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => simulate.mutate(c.id)} disabled={simulate.isPending}>Simular pagamento</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
