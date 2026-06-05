import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Star, Plus, Search, Eye, Edit, Trash2, Mail, Phone, MapPin, MoreHorizontal, Loader2 } from 'lucide-react';
import { usePurchasing } from '@/hooks/purchasing/usePurchasingQuery';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/base/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/ui/base/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Textarea } from '@/ui/base/textarea';
import { supplierCategories } from '@/config/purchasing';
import { useCnpjLookup } from '@/hooks/system/useCnpjLookup';
import { Supplier } from '@/types/purchasing';

const statusConfig = {
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800' },
  blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
};

export default function SuppliersPage() {
  const { suppliers: rawSuppliers, suppliersLoading: loading, createSupplier } = usePurchasing();
  const suppliers: Supplier[] = (rawSuppliers || []).map((s: any) => ({
    id: s.id, code: s.code, name: s.name, tradeName: s.trade_name,
    document: s.document, documentType: s.document_type, email: s.email || '',
    phone: s.phone || '', cellphone: s.cellphone, status: s.status,
    category: s.category || '', paymentTerms: s.payment_terms || '', deliveryTime: s.delivery_time,
    rating: Number(s.rating), createdAt: s.created_at, updatedAt: s.updated_at,
    address: { street: s.address_street, number: s.address_number, complement: s.address_complement,
      neighborhood: s.address_neighborhood, city: s.address_city, state: s.address_state, zipCode: s.address_zip_code },
  }));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const cnpjLookup = useCnpjLookup();

  const handleSupplierCnpjLookup = async () => {
    if (!formData.document) return;
    const data = await cnpjLookup.lookup(formData.document);
    if (data) {
      setFormData(p => ({
        ...p,
        name: data.razao_social,
        tradeName: data.nome_fantasia,
        email: data.email || p.email,
        phone: data.telefone || p.phone,
        address: {
          ...p.address,
          street: data.logradouro,
          number: data.numero,
          complement: data.complemento,
          neighborhood: data.bairro,
          city: data.municipio,
          state: data.uf,
          zipCode: data.cep,
        },
      }));
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.document.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const summaryData = {
    total: suppliers.length,
    active: suppliers.filter((s) => s.status === 'active').length,
    inactive: suppliers.filter((s) => s.status === 'inactive').length,
    blocked: suppliers.filter((s) => s.status === 'blocked').length,
  };

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsViewOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData(supplier);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setSelectedSupplier(null);
    setFormData({
      status: 'active',
      documentType: 'cnpj',
      rating: 3,
      deliveryTime: 7,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    // TODO: implement remove mutation
  };

  const handleSave = async () => {
    if (selectedSupplier) {
      // TODO: implement update mutation
        name: formData.name, trade_name: formData.tradeName, document: formData.document,
        document_type: formData.documentType, email: formData.email, phone: formData.phone,
        cellphone: formData.cellphone, category: formData.category, status: formData.status,
        payment_terms: formData.paymentTerms, delivery_time: formData.deliveryTime, rating: formData.rating,
        address_street: formData.address?.street, address_number: formData.address?.number,
        address_complement: formData.address?.complement, address_neighborhood: formData.address?.neighborhood,
        address_city: formData.address?.city, address_state: formData.address?.state, address_zip_code: formData.address?.zipCode,
      });
    } else {
      await createSupplier({
        code: `F${String(suppliers.length + 1).padStart(4, '0')}`,
        name: formData.name || '', document: formData.document || '', document_type: formData.documentType || 'cnpj',
        email: formData.email, phone: formData.phone, cellphone: formData.cellphone,
        trade_name: formData.tradeName, category: formData.category, status: formData.status || 'active',
        payment_terms: formData.paymentTerms, delivery_time: formData.deliveryTime || 7, rating: formData.rating || 3,
        address_street: formData.address?.street || '', address_number: formData.address?.number || '',
        address_complement: formData.address?.complement, address_neighborhood: formData.address?.neighborhood || '',
        address_city: formData.address?.city || '', address_state: formData.address?.state || '', address_zip_code: formData.address?.zipCode || '',
      });
    }
    setIsFormOpen(false);
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Fornecedores" description="Gerencie o cadastro de fornecedores">
        <ExportButton
          data={filteredSuppliers as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'code', label: 'Código' },
            { key: 'name', label: 'Nome' },
            { key: 'document', label: 'CNPJ' },
            { key: 'category', label: 'Categoria' },
            { key: 'email', label: 'E-mail' },
            { key: 'phone', label: 'Telefone' },
            { key: 'status', label: 'Status' },
          ]}
          filename="fornecedores"
        />
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryData.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{summaryData.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryData.blocked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {supplierCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prazo Entrega</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.code}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.tradeName && (
                        <div className="text-sm text-muted-foreground">{supplier.tradeName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.document}</TableCell>
                  <TableCell>{supplier.category}</TableCell>
                  <TableCell>{supplier.deliveryTime} dias</TableCell>
                  <TableCell>{renderRating(supplier.rating)}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[supplier.status].className}>
                      {statusConfig[supplier.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(supplier)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Fornecedor</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{selectedSupplier.name}</h3>
                  {selectedSupplier.tradeName && (
                    <p className="text-muted-foreground">{selectedSupplier.tradeName}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Código: {selectedSupplier.code}</p>
                </div>
                <Badge className={statusConfig[selectedSupplier.status].className}>
                  {statusConfig[selectedSupplier.status].label}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedSupplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedSupplier.phone}</span>
                  </div>
                  {selectedSupplier.cellphone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSupplier.cellphone}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>
                        {selectedSupplier.address.street}, {selectedSupplier.address.number}
                      </p>
                      {selectedSupplier.address.complement && (
                        <p>{selectedSupplier.address.complement}</p>
                      )}
                      <p>
                        {selectedSupplier.address.neighborhood} - {selectedSupplier.address.city}/
                        {selectedSupplier.address.state}
                      </p>
                      <p>CEP: {selectedSupplier.address.zipCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{selectedSupplier.category}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
                    <p className="font-medium">{selectedSupplier.deliveryTime} dias</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Cond. Pagamento</p>
                    <p className="font-medium">{selectedSupplier.paymentTerms}</p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Avaliação</p>
                {renderRating(selectedSupplier.rating)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier
                ? 'Atualize os dados do fornecedor'
                : 'Preencha os dados do novo fornecedor'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Razão Social *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.tradeName || ''}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CNPJ/CPF *</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.document || ''}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={handleSupplierCnpjLookup} disabled={cnpjLookup.loading} title="Buscar dados na Receita Federal">
                    {cnpjLookup.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Prazo Entrega (dias)</Label>
                <Input
                  type="number"
                  value={formData.deliveryTime || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryTime: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cond. Pagamento</Label>
                <Input
                  value={formData.paymentTerms || ''}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value: 'active' | 'inactive' | 'blocked') =>
                    setFormData({ ...formData, status: value })
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
    </PageContainer>
  );
}
