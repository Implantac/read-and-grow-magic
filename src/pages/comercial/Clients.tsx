import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, MoreHorizontal, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatBRL } from '@/lib/formatters';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { clientSegments, brazilianStates } from '@/config/commercial';
import { useClients, useDeleteClient, type DbClient } from '@/hooks/useClients';
import { ClientDetailDialog } from '@/components/comercial/ClientDetailDialog';
import { ClientFormDialog } from '@/components/comercial/ClientFormDialog';
import { ClientStats } from '@/components/comercial/ClientStats';

const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'active', label: 'Ativo' }, { value: 'inactive', label: 'Inativo' }, { value: 'blocked', label: 'Bloqueado' },
  ]},
  { key: 'segment', label: 'Segmento', type: 'select', options: clientSegments },
  { key: 'state', label: 'Estado', type: 'select', options: brazilianStates },
  { key: 'abc_classification', label: 'Curva ABC', type: 'select', options: [
    { value: 'A', label: 'A - Alta' }, { value: 'B', label: 'B - Média' }, { value: 'C', label: 'C - Baixa' },
  ]},
];

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients();
  const deleteClient = useDeleteClient();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<DbClient | null>(null);

  const filteredClients = clients.filter((client) => {
    if (filters.status && client.status !== filters.status) return false;
    if (filters.segment && client.segment !== filters.segment) return false;
    if (filters.state && client.address_state !== filters.state) return false;
    if (filters.abc_classification && client.abc_classification !== filters.abc_classification) return false;
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

  const handleOpenForm = (client?: DbClient) => {
    setSelectedClient(client || null);
    setIsFormOpen(true);
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
      <PageHeader title="Clientes" description="Gerencie sua base de clientes com inteligência comercial">
        <ExportButton
          data={filteredClients as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'code', label: 'Código' }, { key: 'name', label: 'Nome/Razão Social' },
            { key: 'document', label: 'CPF/CNPJ' }, { key: 'email', label: 'E-mail' },
            { key: 'phone', label: 'Telefone' }, { key: 'address_city', label: 'Cidade' },
            { key: 'address_state', label: 'UF' },
            { key: 'credit_limit', label: 'Limite de Crédito', format: (v) => formatBRL(Number(v)) },
            { key: 'status', label: 'Status' },
          ]}
          filename="clientes"
        />
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />Novo Cliente
        </Button>
      </PageHeader>

      <ClientStats clients={clients} />

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />

      <DataTable columns={columns} data={filteredClients} searchPlaceholder="Buscar por nome, CPF/CNPJ, e-mail..." pageSize={10} actions={renderActions} />

      <ClientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        totalClients={clients.length}
      />

      <ClientDetailDialog client={selectedClient} open={isViewOpen} onOpenChange={setIsViewOpen} />

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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={deleteClient.isPending}>
              {deleteClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
