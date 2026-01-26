import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Box,
  Filter,
  FileText,
} from 'lucide-react';
import {
  products as initialProducts,
  categories,
  productStatusConfig,
  productTypeConfig,
} from '@/data/inventoryMockData';
import type { Product, ProductType, ProductStatus, ProductFilters } from '@/types/inventory';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all',
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      filters.search === '' ||
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.code.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.type === 'all' || product.type === filters.type;
    const matchesCategory = filters.category === 'all' || product.category === filters.category;
    const matchesStatus = filters.status === 'all' || product.status === filters.status;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const activeProducts = products.filter((p) => p.status === 'active').length;
  const totalValue = products.reduce((acc, p) => acc + p.costPrice * (p.minStock || 0), 0);

  const getStatusBadge = (status: ProductStatus) => {
    const config = productStatusConfig.find((s) => s.value === status);
    return <Badge className={config?.color}>{config?.label}</Badge>;
  };

  const getTypeBadge = (type: ProductType) => {
    const config = productTypeConfig.find((t) => t.value === type);
    return <Badge variant="outline" className={config?.color}>{config?.label}</Badge>;
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      setProducts(products.filter((p) => p.id !== selectedProduct.id));
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Cadastro e controle de produtos</p>
        </div>
        <Button onClick={() => { setSelectedProduct(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">{categories.length} categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {((activeProducts / products.length) * 100).toFixed(0)}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(products.reduce((acc, p) => acc + p.costPrice, 0) / products.length)}
            </div>
            <p className="text-xs text-muted-foreground">Custo médio por produto</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Estimado</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Baseado no estoque mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value as ProductType | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {productTypeConfig.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as ProductStatus | 'all' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {productStatusConfig.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
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
                  <TableCell colSpan={9} className="h-24 text-center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.barcode && (
                          <div className="text-xs text-muted-foreground">{product.barcode}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(product.type)}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.salePrice)}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product)}>
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
            <DialogDescription>
              {selectedProduct?.code} - {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="stock">Estoque</TabsTrigger>
                <TabsTrigger value="dimensions">Dimensões</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Código</Label>
                    <p className="font-medium">{selectedProduct.code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Código de Barras</Label>
                    <p className="font-medium">{selectedProduct.barcode || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="font-medium">{selectedProduct.description || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tipo</Label>
                    <div className="mt-1">{getTypeBadge(selectedProduct.type)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Categoria</Label>
                    <p className="font-medium">{selectedProduct.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Custo</Label>
                    <p className="font-medium">{formatCurrency(selectedProduct.costPrice)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Preço de Venda</Label>
                    <p className="font-medium">{formatCurrency(selectedProduct.salePrice)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedProduct.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fornecedor</Label>
                    <p className="font-medium">{selectedProduct.supplier || '-'}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="stock" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Unidade</Label>
                    <p className="font-medium">{selectedProduct.unit}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Localização</Label>
                    <p className="font-medium">{selectedProduct.location || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estoque Mínimo</Label>
                    <p className="font-medium">{selectedProduct.minStock}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estoque Máximo</Label>
                    <p className="font-medium">{selectedProduct.maxStock}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ponto de Reposição</Label>
                    <p className="font-medium">{selectedProduct.reorderPoint}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Lead Time</Label>
                    <p className="font-medium">{selectedProduct.leadTimeDays} dias</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="dimensions" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Peso</Label>
                    <p className="font-medium">
                      {selectedProduct.weight ? `${selectedProduct.weight} kg` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Largura</Label>
                    <p className="font-medium">
                      {selectedProduct.width ? `${selectedProduct.width} cm` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Altura</Label>
                    <p className="font-medium">
                      {selectedProduct.height ? `${selectedProduct.height} cm` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Profundidade</Label>
                    <p className="font-medium">
                      {selectedProduct.depth ? `${selectedProduct.depth} cm` : '-'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do produto
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input id="code" defaultValue={selectedProduct?.code} placeholder="PROD-XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input id="barcode" defaultValue={selectedProduct?.barcode} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" defaultValue={selectedProduct?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" defaultValue={selectedProduct?.description} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select defaultValue={selectedProduct?.type || 'finished'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypeConfig.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select defaultValue={selectedProduct?.category || categories[0]?.name}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade *</Label>
                <Input id="unit" defaultValue={selectedProduct?.unit || 'UN'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Custo *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.costPrice}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Preço de Venda *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  defaultValue={selectedProduct?.salePrice}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStock">Estoque Mín.</Label>
                <Input
                  id="minStock"
                  type="number"
                  defaultValue={selectedProduct?.minStock}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Estoque Máx.</Label>
                <Input
                  id="maxStock"
                  type="number"
                  defaultValue={selectedProduct?.maxStock}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Ponto Repos.</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  defaultValue={selectedProduct?.reorderPoint}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadTime">Lead Time</Label>
                <Input
                  id="leadTime"
                  type="number"
                  defaultValue={selectedProduct?.leadTimeDays}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={selectedProduct?.status || 'active'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productStatusConfig.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsFormOpen(false)}>
              {selectedProduct ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduct?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
