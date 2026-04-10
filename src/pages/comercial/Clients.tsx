import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, MoreHorizontal, Search, Loader2, Star, TrendingUp, Target } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { clientSegments, brazilianStates } from '@/config/commercial';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, type DbClient } from '@/hooks/useClients';
import { useSalesReps } from '@/hooks/useSalesReps';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { ClientDetailDialog } from '@/components/comercial/ClientDetailDialog';

const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }, { value: 'blocked', label: 'Bloqueado' },
  ]},
  { key: 'segment', label: 'Segmento', type: 'select', options: clientSegments },
  { key: 'state', label: 'Estado', type: 'select', options: brazilianStates },
];

export default function ClientsPage() {
  const { toast } = useToast();
  const { data: clients = [], isLoading } = useClients();
  const { data: salesReps = [] } = useSalesReps();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const cnpjLookup = useCnpjLookup();

  const handleCnpjLookup = async () => {
    if (formData.document_type !== 'cnpj') return;
    const data = await cnpjLookup.lookup(formData.document);
    if (data) {
      setFormData(p => ({
        ...p,
        name: data.razao_social,
        trade_name: data.nome_fantasia,
        email: data.email || p.email,
        phone: data.telefone || p.phone,
        address_street: data.logradouro,
        address_number: data.numero,
        address_complement: data.complemento,
        address_neighborhood: data.bairro,
        address_city: data.municipio,
        address_state: data.uf,
        address_zip_code: data.cep,
      }));
    }
  };

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<DbClient | null>(null);
  const [formData, setFormData] = useState({
    name: '', trade_name: '', document: '', document_type: 'cnpj' as string,
    email: '', phone: '', cellphone: '',
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '', address_zip_code: '',
    status: 'active', credit_limit: '', segment: '',
    state_registration: '', municipal_registration: '',
    region: '', micro_region: '', default_payment_condition: 'À vista',
    price_table: 'default', abc_classification: 'C',
    commercial_notes: '', estimated_potential: '',
  });

  const filteredClients = clients.filter((client) => {
    if (filters.status && client.status !== filters.status) return false;
    if (filters.segment && client.segment !== filters.segment) return false;
    if (filters.state && client.address_state !== filters.state) return false;
    return true;
  });

  const columns: Column<DbClient>[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nome/Razão Social', sortable: true, render: (_, row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        {row.trade_name && <p className="text-[10px] text-muted-foreground">{row.trade_name}</p>}
      </div>
    )},
    { key: 'document', label: 'CPF/CNPJ', sortable: true },
    { key: 'address_city', label: 'Cidade/UF', render: (_, row) => `${row.address_city}/${row.address_state}` },
    { key: 'abc_classification', label: 'ABC', sortable: true, render: (v) => (
      <Badge variant={(v as string) === 'A' ? 'default' : 'secondary'} className="text-xs font-bold w-7 justify-center">{(v as string) || 'C'}</Badge>
    )},
    { key: 'client_score', label: 'Score', render: (v) => {
      const score = (v as string) || 'medium';
      const cfg: Record<string, { label: string; cls: string }> = {
        high: { label: 'Alto', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
        medium: { label: 'Médio', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        low: { label: 'Baixo', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
      };
      return <Badge className={`text-[10px] ${cfg[score]?.cls}`}>{cfg[score]?.label || score}</Badge>;
    }},
    { key: 'credit_limit', label: 'Limite', sortable: true,
      render: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value as number) },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge type="client" status={value as string} /> },
  ];

  const defaultFormData = {
    name: '', trade_name: '', document: '', document_type: 'cnpj' as string,
    email: '', phone: '', cellphone: '',
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '', address_zip_code: '',
    status: 'active', credit_limit: '', segment: '', sales_rep_id: '',
    state_registration: '', municipal_registration: '',
    region: '', micro_region: '', default_payment_condition: 'À vista',
    price_table: 'default', abc_classification: 'C', client_score: 'medium',
    commercial_notes: '', estimated_potential: '',
  };

  const handleOpenForm = (client?: DbClient) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name, trade_name: client.trade_name || '', document: client.document,
        document_type: client.document_type, email: client.email, phone: client.phone,
        cellphone: client.cellphone || '',
        address_street: client.address_street, address_number: client.address_number,
        address_complement: client.address_complement || '', address_neighborhood: client.address_neighborhood,
        address_city: client.address_city, address_state: client.address_state,
        address_zip_code: client.address_zip_code,
        status: client.status, credit_limit: String(client.credit_limit), segment: client.segment || '',
        state_registration: client.state_registration || '', municipal_registration: client.municipal_registration || '',
        region: client.region || '', micro_region: client.micro_region || '',
        default_payment_condition: client.default_payment_condition || 'À vista',
        price_table: client.price_table || 'default', abc_classification: client.abc_classification || 'C',
        commercial_notes: client.commercial_notes || '', estimated_potential: String(client.estimated_potential || ''),
      });
    } else {
      setSelectedClient(null);
      setFormData({ ...defaultFormData });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    const payload: any = {
      name: formData.name, trade_name: formData.trade_name || null, document: formData.document,
      document_type: formData.document_type, email: formData.email, phone: formData.phone,
      cellphone: formData.cellphone || null,
      address_street: formData.address_street, address_number: formData.address_number,
      address_complement: formData.address_complement || null, address_neighborhood: formData.address_neighborhood,
      address_city: formData.address_city, address_state: formData.address_state,
      address_zip_code: formData.address_zip_code,
      status: formData.status, credit_limit: Number(formData.credit_limit) || 0,
      current_balance: 0, segment: formData.segment || null, sales_rep_id: null,
      state_registration: formData.state_registration || null,
      municipal_registration: formData.municipal_registration || null,
      region: formData.region || null, micro_region: formData.micro_region || null,
      default_payment_condition: formData.default_payment_condition || 'À vista',
      price_table: formData.price_table || 'default',
      abc_classification: formData.abc_classification || 'C',
      commercial_notes: formData.commercial_notes || null,
      estimated_potential: Number(formData.estimated_potential) || 0,
    };

    if (selectedClient) {
      updateClient.mutate({ id: selectedClient.id, ...payload }, { onSuccess: () => setIsFormOpen(false) });
    } else {
      const code = `CLI${String(clients.length + 1).padStart(3, '0')}`;
      createClient.mutate({ ...payload, code }, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleDelete = () => {
    if (selectedClient) {
      deleteClient.mutate(selectedClient.id, { onSuccess: () => { setIsDeleteOpen(false); setSelectedClient(null); } });
    }
  };

  const renderActions = (client: DbClient) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => { setSelectedClient(client); setIsViewOpen(true); }}>
          <Eye className="mr-2 h-4 w-4" />Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenForm(client)}>
          <Pencil className="mr-2 h-4 w-4" />Editar
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedClient(client); setIsDeleteOpen(true); }}>
          <Trash2 className="mr-2 h-4 w-4" />Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return <PageLoading message="Carregando clientes..." />;
  }

  return (
    <PageContainer>
      <PageHeader title="Clientes" description="Gerencie sua base de clientes">
          <ExportButton
            data={filteredClients as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'code', label: 'Código' }, { key: 'name', label: 'Nome/Razão Social' },
              { key: 'document', label: 'CPF/CNPJ' }, { key: 'email', label: 'E-mail' },
              { key: 'phone', label: 'Telefone' }, { key: 'address_city', label: 'Cidade' },
              { key: 'address_state', label: 'UF' },
              { key: 'credit_limit', label: 'Limite de Crédito', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
              { key: 'status', label: 'Status' },
            ]}
            filename="clientes"
          />
          <Button onClick={() => handleOpenForm()} className="gap-2">
            <Plus className="h-4 w-4" />Novo Cliente
          </Button>
      </PageHeader>

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />

      <DataTable columns={columns} data={filteredClients} searchPlaceholder="Buscar por nome, CPF/CNPJ, e-mail..." pageSize={10} actions={renderActions} />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>{selectedClient ? 'Altere os dados do cliente' : 'Preencha os dados para cadastrar um novo cliente'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={formData.document_type} onValueChange={(v) => setFormData(p => ({ ...p, document_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{formData.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
                <div className="flex gap-2">
                  <Input value={formData.document} onChange={(e) => setFormData(p => ({ ...p, document: e.target.value }))} placeholder={formData.document_type === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'} />
                  {formData.document_type === 'cnpj' && (
                    <Button type="button" variant="outline" size="icon" onClick={handleCnpjLookup} disabled={cnpjLookup.loading} title="Buscar dados na Receita Federal">
                      {cnpjLookup.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{formData.document_type === 'cnpj' ? 'Razão Social' : 'Nome Completo'}</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            {formData.document_type === 'cnpj' && (
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input value={formData.trade_name} onChange={(e) => setFormData(p => ({ ...p, trade_name: e.target.value }))} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(00) 0000-0000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input value={formData.cellphone} onChange={(e) => setFormData(p => ({ ...p, cellphone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select value={formData.segment} onValueChange={(v) => setFormData(p => ({ ...p, segment: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {clientSegments.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Endereço</h4>
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Logradouro</Label>
                    <Input value={formData.address_street} onChange={(e) => setFormData(p => ({ ...p, address_street: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={formData.address_number} onChange={(e) => setFormData(p => ({ ...p, address_number: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input value={formData.address_complement} onChange={(e) => setFormData(p => ({ ...p, address_complement: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={formData.address_neighborhood} onChange={(e) => setFormData(p => ({ ...p, address_neighborhood: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={formData.address_city} onChange={(e) => setFormData(p => ({ ...p, address_city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={formData.address_state} onValueChange={(v) => setFormData(p => ({ ...p, address_state: v }))}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input value={formData.address_zip_code} onChange={(e) => setFormData(p => ({ ...p, address_zip_code: e.target.value }))} placeholder="00000-000" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Limite de Crédito</Label>
                <Input type="number" value={formData.credit_limit} onChange={(e) => setFormData(p => ({ ...p, credit_limit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">Dados Comerciais</h4>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inscrição Estadual</Label>
                    <Input value={formData.state_registration} onChange={(e) => setFormData(p => ({ ...p, state_registration: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Inscrição Municipal</Label>
                    <Input value={formData.municipal_registration} onChange={(e) => setFormData(p => ({ ...p, municipal_registration: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Região</Label>
                    <Input value={formData.region} onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))} placeholder="Ex: Sul, Sudeste..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Micro-Região</Label>
                    <Input value={formData.micro_region} onChange={(e) => setFormData(p => ({ ...p, micro_region: e.target.value }))} placeholder="Ex: Grande SP..." />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Condição de Pagamento</Label>
                    <Select value={formData.default_payment_condition} onValueChange={(v) => setFormData(p => ({ ...p, default_payment_condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="À vista">À Vista</SelectItem>
                        <SelectItem value="30 dias">30 Dias</SelectItem>
                        <SelectItem value="30/60 dias">30/60 Dias</SelectItem>
                        <SelectItem value="30/60/90 dias">30/60/90 Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tabela de Preço</Label>
                    <Select value={formData.price_table} onValueChange={(v) => setFormData(p => ({ ...p, price_table: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Padrão</SelectItem>
                        <SelectItem value="wholesale">Atacado</SelectItem>
                        <SelectItem value="special">Especial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Classificação ABC</Label>
                    <Select value={formData.abc_classification} onValueChange={(v) => setFormData(p => ({ ...p, abc_classification: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A - Alta</SelectItem>
                        <SelectItem value="B">B - Média</SelectItem>
                        <SelectItem value="C">C - Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Potencial Estimado (R$)</Label>
                  <Input type="number" value={formData.estimated_potential} onChange={(e) => setFormData(p => ({ ...p, estimated_potential: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Observações Comerciais</Label>
                  <Input value={formData.commercial_notes} onChange={(e) => setFormData(p => ({ ...p, commercial_notes: e.target.value }))} placeholder="Notas internas sobre o cliente..." />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createClient.isPending || updateClient.isPending}>
              {(createClient.isPending || updateClient.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog with Timeline */}
      <ClientDetailDialog client={selectedClient} open={isViewOpen} onOpenChange={setIsViewOpen} />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{selectedClient?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
