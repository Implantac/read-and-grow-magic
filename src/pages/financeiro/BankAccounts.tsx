import { useState } from 'react';
import { Plus, Building2, Edit } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBankAccounts, useCreateBankAccount } from '@/hooks/useBankAccounts';

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function BankAccounts() {
  const { data: accounts = [], isLoading } = useBankAccounts();
  const createMut = useCreateBankAccount();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', bank_name: '', bank_code: '', agency: '', account_number: '', account_type: 'checking' });

  const handleSubmit = () => {
    if (!form.name || !form.bank_name) return;
    createMut.mutate(form, { onSuccess: () => { setOpen(false); setForm({ name: '', bank_name: '', bank_code: '', agency: '', account_number: '', account_type: 'checking' }); } });
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  if (isLoading) return <PageLoading message="Carregando contas bancárias..." />;

  return (
    <PageContainer>
      <PageHeader title="Tesouraria" description="Controle de contas bancárias e saldos">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Nova Conta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Conta Bancária</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Conta Principal" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Banco *</Label><Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Banco do Brasil" /></div>
                <div className="grid gap-2"><Label>Código</Label><Input value={form.bank_code} onChange={e => setForm({ ...form, bank_code: e.target.value })} placeholder="001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Agência</Label><Input value={form.agency} onChange={e => setForm({ ...form, agency: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Conta</Label><Input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} /></div>
              </div>
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={form.account_type} onValueChange={v => setForm({ ...form, account_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="cash">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMut.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle className="text-base">Saldo Total: {formatCurrency(totalBalance)}</CardTitle></CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(acc => (
          <Card key={acc.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-sm">{acc.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{acc.bank_name} {acc.agency && `| Ag: ${acc.agency}`} {acc.account_number && `| CC: ${acc.account_number}`}</p>
                </div>
              </div>
              <Badge variant={acc.active ? 'default' : 'secondary'}>{acc.active ? 'Ativa' : 'Inativa'}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(Number(acc.balance))}</p>
              <p className="text-xs text-muted-foreground mt-1">{acc.account_type === 'checking' ? 'Conta Corrente' : acc.account_type === 'savings' ? 'Poupança' : acc.account_type === 'investment' ? 'Investimento' : 'Caixa'}</p>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conta bancária cadastrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
