import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Star, Plus, Search, Eye, Edit, Trash2, Mail, Phone, MapPin, MoreHorizontal, Loader2, ExternalLink } from 'lucide-react';
import { usePurchasing } from '@/hooks/purchasing/usePurchasingQuery';
import { Supplier360Drawer } from '@/modules/purchasing/components/Supplier360Drawer';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/ui/base/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Textarea } from '@/ui/base/textarea';
import { supplierCategories } from '@/config/purchasing';
import { useCnpjLookup } from '@/hooks/system/useCnpjLookup';
import { Supplier } from '@/types/purchasing';
import { EmptyState } from '@/shared/components/EmptyState';
import { Building2 } from 'lucide-react';
import { toastError } from '@/lib/toastHelpers';

interface SupplierRow {
  id: string; code: string; name: string; trade_name?: string; document: string;
  document_type: Supplier['documentType']; email?: string | null; phone?: string | null;
  cellphone?: string; status: Supplier['status']; category?: string | null;
  payment_terms?: string | null; delivery_time?: number; rating?: number | string;
  created_at: string; updated_at: string;
  address_street?: string; address_number?: string; address_complement?: string;
  address_neighborhood?: string; address_city?: string; address_state?: string; address_zip_code?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800' },
  blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
};

export default function SuppliersPage() {
  const { suppliers, suppliersLoading: loading, createSupplier, updateSupplier, savingSupplier } = usePurchasing();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [is360Open, setIs360Open] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const handleOpen360 = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIs360Open(true);
  };
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

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.document?.trim()) {
      toastError('Informe o nome e o documento do fornecedor.');
      return;
    }
    const values = {
        name: formData.name.trim(), document: formData.document.trim(), document_type: formData.documentType || 'cnpj',
        email: formData.email, phone: formData.phone, cellphone: formData.cellphone,
        trade_name: formData.tradeName, category: formData.category, status: formData.status || 'active',
        payment_terms: formData.paymentTerms, delivery_time: formData.deliveryTime || 7, rating: formData.rating || 3,
        address_street: formData.address?.street || '', address_number: formData.address?.number || '',
        address_complement: formData.address?.complement, address_neighborhood: formData.address?.neighborhood || '',
        address_city: formData.address?.city || '', address_state: formData.address?.state || '', address_zip_code: formData.address?.zipCode || '',
    };
    try {
      if (selectedSupplier) {
        await updateSupplier({ id: selectedSupplier.id, values });
      } else {
        await createSupplier({ ...values, code: `F-${crypto.randomUUID().slice(0, 8).toUpperCase()}` });
      }
      setIsFormOpen(false);
      setSelectedSupplier(null);
      setFormData({});
    } catch {
      // A mensagem de erro é exibida pela mutação; mantenha o formulário aberto.
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

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
        <Button onClick={() => { setSelectedSupplier(null); setFormData({}); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" />Novo Fornecedor</Button>
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState icon={Building2} title="Nenhum fornecedor cadastrado" description="Cadastre fornecedores para vinculá-los a cotações e pedidos de compra." />
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.code}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.tradeName && <div className="text-sm text-muted-foreground">{supplier.tradeName}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.document}</TableCell>
                  <TableCell>{supplier.category}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[supplier.status]?.className || ''}>
                      {statusConfig[supplier.status]?.label || supplier.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpen360(supplier)}><ExternalLink className="mr-2 h-4 w-4" />Visão 360°</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedSupplier(supplier); setIsViewOpen(true); }}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedSupplier(supplier); setFormData(supplier); setIsFormOpen(true); }}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Supplier360Drawer 
        open={is360Open} 
        onOpenChange={setIs360Open} 
        supplier={selectedSupplier} 
      />
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor para utilizá-lo nas compras.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label htmlFor="supplier-name">Razão social *</Label><Input id="supplier-name" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="supplier-document">Documento *</Label><Input id="supplier-document" value={formData.document || ''} onChange={e => setFormData(p => ({ ...p, document: e.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="supplier-type">Tipo</Label><Select value={formData.documentType || 'cnpj'} onValueChange={v => setFormData(p => ({ ...p, documentType: v as Supplier['documentType'] }))}><SelectTrigger id="supplier-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cnpj">CNPJ</SelectItem><SelectItem value="cpf">CPF</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="supplier-trade">Nome fantasia</Label><Input id="supplier-trade" value={formData.tradeName || ''} onChange={e => setFormData(p => ({ ...p, tradeName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="supplier-email">E-mail</Label><Input id="supplier-email" type="email" value={formData.email || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="supplier-phone">Telefone</Label><Input id="supplier-phone" value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="supplier-status">Situação</Label><Select value={formData.status || 'active'} onValueChange={v => setFormData(p => ({ ...p, status: v as Supplier['status'] }))}><SelectTrigger id="supplier-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem><SelectItem value="blocked">Bloqueado</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button><Button disabled={savingSupplier} onClick={handleSave}>{savingSupplier ? 'Salvando...' : 'Salvar fornecedor'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent><DialogHeader><DialogTitle>{selectedSupplier?.name}</DialogTitle><DialogDescription>Dados do fornecedor</DialogDescription></DialogHeader>
          {selectedSupplier && <div className="space-y-2 text-sm"><p><strong>Documento:</strong> {selectedSupplier.document}</p><p><strong>Contato:</strong> {selectedSupplier.email || 'Não informado'} · {selectedSupplier.phone || 'Não informado'}</p><p><strong>Situação:</strong> {statusConfig[selectedSupplier.status]?.label || selectedSupplier.status}</p></div>}
          <DialogFooter><Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
