import { useState, useMemo } from 'react';
import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { formatBRL } from '@/lib/formatters';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Textarea } from '@/ui/base/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Package, Plus, Search, Edit, Eye, Trash2, Box, Filter, FileText, Loader2 } from 'lucide-react';
import { productStatusConfig, productTypeConfig } from '@/config/inventory';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { useInventory } from '@/hooks/inventory/useInventoryQuery';
import type { DbProduct } from '@/hooks/inventory/useProducts';
import type { ProductType, ProductStatus, ProductFilters } from '@/types/inventory';
import { EmptyState } from '@/shared/components/EmptyState';
import { ProductFormDialog } from '@/components/inventory/ProductFormDialog';

export default function ProductsPage() {
  const { products, productsLoading: isLoading, categories, deleteProduct } = useInventory();

  const [filters, setFilters] = useState<ProductFilters>({
    search: '', type: 'all', category: 'all', status: 'all',
  });
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '', barcode: '', name: '', description: '', type: 'finished',
    category_id: '', unit: 'UN', cost_price: '', sale_price: '',
    min_stock: '0', max_stock: '0', reorder_point: '0', lead_time_days: '0',
    supplier: '', location: '', status: 'active',
  });

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesSearch = filters.search === '' ||
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.code.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = filters.type === 'all' || product.type === filters.type;
      const matchesCategory = filters.category === 'all' ||
        categories.find((c: any) => c.id === product.category_id)?.name === filters.category;
      const matchesStatus = filters.status === 'all' || product.status === filters.status;
      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [products, filters, categories]);

  const activeProducts = products.filter((p: any) => p.status === 'active').length;
  const totalValue = products.reduce((acc: number, p: any) => acc + (Number(p.cost_price) || 0) * (p.min_stock || 0), 0);

  const getStatusBadge = (status: string) => {
    const config = productStatusConfig.find((s) => s.value === status);
    return <Badge className={config?.color}>{config?.label || status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const config = productTypeConfig.find((t) => t.value === type);
    return <Badge variant="outline" className={config?.color}>{config?.label || type}</Badge>;
  };

  const handleOpenForm = (product?: any) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        code: product.code, barcode: product.barcode || '', name: product.name,
        description: product.description || '', type: product.type,
        category_id: product.category_id || '', unit: product.unit,
        cost_price: String(product.cost_price), sale_price: String(product.sale_price),
        min_stock: String(product.min_stock), max_stock: String(product.max_stock),
        reorder_point: String(product.reorder_point), lead_time_days: String(product.lead_time_days),
        supplier: product.supplier || '', location: product.location || '', status: product.status,
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        code: '', barcode: '', name: '', description: '', type: 'finished',
        category_id: '', unit: 'UN', cost_price: '', sale_price: '',
        min_stock: '0', max_stock: '0', reorder_point: '0', lead_time_days: '0',
        supplier: '', location: '', status: 'active',
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = () => {
    const payload = {
      code: formData.code, barcode: formData.barcode || null, name: formData.name,
      description: formData.description || null, type: formData.type,
      category_id: formData.category_id || null, unit: formData.unit,
      cost_price: Number(formData.cost_price) || 0, sale_price: Number(formData.sale_price) || 0,
      min_stock: Number(formData.min_stock) || 0, max_stock: Number(formData.max_stock) || 0,
      reorder_point: Number(formData.reorder_point) || 0, lead_time_days: Number(formData.lead_time_days) || 0,
      supplier: formData.supplier || null, location: formData.location || null, status: formData.status,
    };

    if (selectedProduct) {
      updateProduct({ id: selectedProduct.id, updates: payload }).then(() => {
        setIsFormOpen(false);
        setSelectedProduct(null);
      });
    } else {
      createProduct(payload).then(() => {
        setIsFormOpen(false);
        setSelectedProduct(null);
      });
    }
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id).then(() => { 
        setIsDeleteOpen(false); 
        setSelectedProduct(null); 
      });
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <PageContainer>
      <PageHeader title="Produtos" description="Cadastro e controle de produtos">
        <ExportButton
            data={filteredProducts as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'code', label: 'Código' },
              { key: 'name', label: 'Nome' },
              { key: 'type', label: 'Tipo' },
              { key: 'categoryName', label: 'Categoria' },
              { key: 'unit', label: 'Unidade' },
              { key: 'cost_price', label: 'Custo', format: (v) => formatBRL(Number(v)) },
              { key: 'sale_price', label: 'Preço Venda', format: (v) => formatBRL(Number(v)) },
              { key: 'status', label: 'Status' },
            ]}
            filename="produtos"
          />
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPICard title="Total de Produtos" value={products.length} icon={<Package className="h-5 w-5" />} subtitle={`${categories.length} categorias`} index={0} />
        <KPICard title="Produtos Ativos" value={activeProducts} icon={<Box className="h-5 w-5" />} accentColor="success" subtitle={`${products.length > 0 ? ((activeProducts / products.length) * 100).toFixed(0) : 0}% do total`} index={1} />
        <KPICard title="Custo Médio" value={formatBRL(products.length > 0 ? products.reduce((acc: number, p: any) => acc + (Number(p.cost_price) || 0), 0) / products.length : 0)} icon={<FileText className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Valor Estimado" value={formatBRL(totalValue)} icon={<Package className="h-5 w-5" />} accentColor="warning" subtitle="Baseado no estoque mínimo" index={3} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v as ProductType | 'all' })}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {productTypeConfig.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as ProductStatus | 'all' })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {productStatusConfig.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
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
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Preço Venda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-4">
                    <EmptyState
                      compact
                      title="Nenhum produto encontrado"
                      description="Cadastre um produto ou ajuste os filtros para visualizar seu catálogo."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.barcode && <div className="text-xs text-muted-foreground">{product.barcode}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(product.type)}</TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell className="text-right">{formatBRL(product.cost_price)}</TableCell>
                    <TableCell className="text-right">{formatBRL(product.sale_price)}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsViewOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setIsDeleteOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>{selectedProduct?.code} - {selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="stock">Estoque</TabsTrigger>
                <TabsTrigger value="dimensions">Dimensões</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Código</Label><p className="font-medium">{selectedProduct.code}</p></div>
                  <div><Label className="text-muted-foreground">Código de Barras</Label><p className="font-medium">{selectedProduct.barcode || '-'}</p></div>
                  <div className="col-span-2"><Label className="text-muted-foreground">Nome</Label><p className="font-medium">{selectedProduct.name}</p></div>
                  <div className="col-span-2"><Label className="text-muted-foreground">Descrição</Label><p className="font-medium">{selectedProduct.description || '-'}</p></div>
                  <div><Label className="text-muted-foreground">Tipo</Label><div className="mt-1">{getTypeBadge(selectedProduct.type)}</div></div>
                  <div><Label className="text-muted-foreground">Categoria</Label><p className="font-medium">{selectedProduct.categoryName}</p></div>
                  <div><Label className="text-muted-foreground">Custo</Label><p className="font-medium">{formatBRL(selectedProduct.cost_price)}</p></div>
                  <div><Label className="text-muted-foreground">Preço de Venda</Label><p className="font-medium">{formatBRL(selectedProduct.sale_price)}</p></div>
                  <div><Label className="text-muted-foreground">Status</Label><div className="mt-1">{getStatusBadge(selectedProduct.status)}</div></div>
                  <div><Label className="text-muted-foreground">Fornecedor</Label><p className="font-medium">{selectedProduct.supplier || '-'}</p></div>
                </div>
              </TabsContent>
              <TabsContent value="stock" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Unidade</Label><p className="font-medium">{selectedProduct.unit}</p></div>
                  <div><Label className="text-muted-foreground">Localização</Label><p className="font-medium">{selectedProduct.location || '-'}</p></div>
                  <div><Label className="text-muted-foreground">Estoque Mínimo</Label><p className="font-medium">{selectedProduct.min_stock}</p></div>
                  <div><Label className="text-muted-foreground">Estoque Máximo</Label><p className="font-medium">{selectedProduct.max_stock}</p></div>
                  <div><Label className="text-muted-foreground">Ponto de Reposição</Label><p className="font-medium">{selectedProduct.reorder_point}</p></div>
                  <div><Label className="text-muted-foreground">Lead Time</Label><p className="font-medium">{selectedProduct.lead_time_days} dias</p></div>
                </div>
              </TabsContent>
              <TabsContent value="dimensions" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Peso</Label><p className="font-medium">{selectedProduct.weight ? `${selectedProduct.weight} kg` : '-'}</p></div>
                  <div><Label className="text-muted-foreground">Largura</Label><p className="font-medium">{selectedProduct.width ? `${selectedProduct.width} cm` : '-'}</p></div>
                  <div><Label className="text-muted-foreground">Altura</Label><p className="font-medium">{selectedProduct.height ? `${selectedProduct.height} cm` : '-'}</p></div>
                  <div><Label className="text-muted-foreground">Profundidade</Label><p className="font-medium">{selectedProduct.depth ? `${selectedProduct.depth} cm` : '-'}</p></div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Código *</Label><Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} /></div>
              <div className="space-y-2"><Label>Código de Barras</Label><Input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Nome *</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label><Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{productTypeConfig.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Categoria</Label><Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Unidade</Label><Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
              <div className="space-y-2"><Label>Custo</Label><Input type="number" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} /></div>
              <div className="space-y-2"><Label>Preço Venda</Label><Input type="number" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Est. Mín</Label><Input type="number" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} /></div>
              <div className="space-y-2"><Label>Est. Máx</Label><Input type="number" value={formData.max_stock} onChange={e => setFormData({...formData, max_stock: e.target.value})} /></div>
              <div className="space-y-2"><Label>Reorder</Label><Input type="number" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: e.target.value})} /></div>
              <div className="space-y-2"><Label>Lead Time</Label><Input type="number" value={formData.lead_time_days} onChange={e => setFormData({...formData, lead_time_days: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Produto</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir o produto {selectedProduct?.name}?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
