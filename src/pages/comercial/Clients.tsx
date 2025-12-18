import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { mockClients, clientSegments, brazilianStates } from '@/data/commercialMockData';
import type { Client } from '@/types/commercial';

const filterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Ativo' },
      { value: 'inactive', label: 'Inativo' },
      { value: 'blocked', label: 'Bloqueado' },
    ],
  },
  {
    key: 'segment',
    label: 'Segmento',
    type: 'select',
    options: clientSegments,
  },
  {
    key: 'state',
    label: 'Estado',
    type: 'select',
    options: brazilianStates,
  },
];

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tradeName: '',
    document: '',
    documentType: 'cnpj' as 'cpf' | 'cnpj',
    email: '',
    phone: '',
    cellphone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'active' as 'active' | 'inactive' | 'blocked',
    creditLimit: '',
    segment: '',
  });

  // Filter clients
  const filteredClients = clients.filter((client) => {
    if (filters.status && client.status !== filters.status) return false;
    if (filters.segment && client.segment !== filters.segment) return false;
    if (filters.state && client.address.state !== filters.state) return false;
    return true;
  });

  const columns: Column<Client>[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nome/Razão Social', sortable: true },
    { key: 'document', label: 'CPF/CNPJ', sortable: true },
    { key: 'email', label: 'E-mail' },
    { key: 'phone', label: 'Telefone' },
    {
      key: 'address.city',
      label: 'Cidade/UF',
      render: (_, row) => `${row.address.city}/${row.address.state}`,
    },
    {
      key: 'creditLimit',
      label: 'Limite de Crédito',
      sortable: true,
      render: (value) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge type="client" status={value as string} />,
    },
  ];

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name,
        tradeName: client.tradeName || '',
        document: client.document,
        documentType: client.documentType,
        email: client.email,
        phone: client.phone,
        cellphone: client.cellphone || '',
        street: client.address.street,
        number: client.address.number,
        complement: client.address.complement || '',
        neighborhood: client.address.neighborhood,
        city: client.address.city,
        state: client.address.state,
        zipCode: client.address.zipCode,
        status: client.status,
        creditLimit: String(client.creditLimit),
        segment: client.segment || '',
      });
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        tradeName: '',
        document: '',
        documentType: 'cnpj',
        email: '',
        phone: '',
        cellphone: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        status: 'active',
        creditLimit: '',
        segment: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (selectedClient) {
      // Update existing client
      setClients((prev) =>
        prev.map((c) =>
          c.id === selectedClient.id
            ? {
                ...c,
                name: formData.name,
                tradeName: formData.tradeName,
                document: formData.document,
                documentType: formData.documentType,
                email: formData.email,
                phone: formData.phone,
                cellphone: formData.cellphone,
                address: {
                  street: formData.street,
                  number: formData.number,
                  complement: formData.complement,
                  neighborhood: formData.neighborhood,
                  city: formData.city,
                  state: formData.state,
                  zipCode: formData.zipCode,
                },
                status: formData.status,
                creditLimit: Number(formData.creditLimit),
                segment: formData.segment,
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
      toast({ title: 'Cliente atualizado com sucesso!' });
    } else {
      // Create new client
      const newClient: Client = {
        id: String(Date.now()),
        code: `CLI${String(clients.length + 1).padStart(3, '0')}`,
        name: formData.name,
        tradeName: formData.tradeName,
        document: formData.document,
        documentType: formData.documentType,
        email: formData.email,
        phone: formData.phone,
        cellphone: formData.cellphone,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        status: formData.status,
        creditLimit: Number(formData.creditLimit),
        currentBalance: 0,
        segment: formData.segment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
      toast({ title: 'Cliente cadastrado com sucesso!' });
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (selectedClient) {
      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      toast({ title: 'Cliente excluído com sucesso!' });
      setIsDeleteOpen(false);
      setSelectedClient(null);
    }
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
    setIsViewOpen(true);
  };

  const renderActions = (client: Client) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleView(client)}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenForm(client)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => {
            setSelectedClient(client);
            setIsDeleteOpen(true);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <AdvancedFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />

      <DataTable
        columns={columns}
        data={filteredClients}
        searchPlaceholder="Buscar por nome, CPF/CNPJ, e-mail..."
        pageSize={10}
        actions={renderActions}
      />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {selectedClient
                ? 'Altere os dados do cliente'
                : 'Preencha os dados para cadastrar um novo cliente'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, documentType: value as 'cpf' | 'cnpj' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="cpf">CPF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document">{formData.documentType === 'cnpj' ? 'CNPJ' : 'CPF'}</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => setFormData((prev) => ({ ...prev, document: e.target.value }))}
                  placeholder={formData.documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{formData.documentType === 'cnpj' ? 'Razão Social' : 'Nome Completo'}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            {formData.documentType === 'cnpj' && (
              <div className="space-y-2">
                <Label htmlFor="tradeName">Nome Fantasia</Label>
                <Input
                  id="tradeName"
                  value={formData.tradeName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tradeName: e.target.value }))}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cellphone">Celular</Label>
                <Input
                  id="cellphone"
                  value={formData.cellphone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cellphone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment">Segmento</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, segment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientSegments.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
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
                    <Label htmlFor="street">Logradouro</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData((prev) => ({ ...prev, complement: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Limite de Crédito</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, creditLimit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as 'active' | 'inactive' | 'blocked',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{selectedClient.code}</span>
                <StatusBadge type="client" status={selectedClient.status} />
              </div>
              <div>
                <h3 className="font-semibold">{selectedClient.name}</h3>
                {selectedClient.tradeName && (
                  <p className="text-sm text-muted-foreground">{selectedClient.tradeName}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">
                    {selectedClient.documentType === 'cnpj' ? 'CNPJ' : 'CPF'}
                  </span>
                  <p>{selectedClient.document}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Segmento</span>
                  <p>{selectedClient.segment || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">E-mail</span>
                  <p>{selectedClient.email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefone</span>
                  <p>{selectedClient.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Limite de Crédito</span>
                  <p>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(selectedClient.creditLimit)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo Atual</span>
                  <p>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(selectedClient.currentBalance)}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4 text-sm">
                <span className="text-muted-foreground">Endereço</span>
                <p>
                  {selectedClient.address.street}, {selectedClient.address.number}
                  {selectedClient.address.complement && ` - ${selectedClient.address.complement}`}
                </p>
                <p>
                  {selectedClient.address.neighborhood} - {selectedClient.address.city}/
                  {selectedClient.address.state}
                </p>
                <p>CEP: {selectedClient.address.zipCode}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente "{selectedClient?.name}"? Esta ação não pode
              ser desfeita.
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
    </div>
  );
}
