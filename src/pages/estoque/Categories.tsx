import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ExportButton } from '@/components/shared/ExportButton';
import { Plus, Search, Edit, Trash2, FolderTree, Package, Filter } from 'lucide-react';
import { categories as initialCategories } from '@/data/inventoryMockData';
import type { ProductCategory } from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', active: true });
  const { toast } = useToast();

  const filteredCategories = categories.filter(c =>
    search === '' || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, c) => sum + c.productsCount, 0);
  const activeCategories = categories.filter(c => c.active).length;

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', active: true });
    setIsFormOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '', active: category.active });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Erro', description: 'O nome da categoria é obrigatório', variant: 'destructive' });
      return;
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c =>
        c.id === editingCategory.id
          ? { ...c, name: formData.name, description: formData.description, active: formData.active }
          : c
      ));
      toast({ title: 'Categoria atualizada', description: `"${formData.name}" foi atualizada com sucesso.` });
    } else {
      const newCategory: ProductCategory = {
        id: String(Date.now()),
        name: formData.name,
        description: formData.description,
        productsCount: 0,
        active: formData.active,
      };
      setCategories(prev => [...prev, newCategory]);
      toast({ title: 'Categoria criada', description: `"${formData.name}" foi adicionada com sucesso.` });
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (editingCategory) {
      if (editingCategory.productsCount > 0) {
        toast({ title: 'Não é possível excluir', description: 'A categoria possui produtos vinculados.', variant: 'destructive' });
      } else {
        setCategories(prev => prev.filter(c => c.id !== editingCategory.id));
        toast({ title: 'Categoria excluída', description: `"${editingCategory.name}" foi removida.` });
      }
      setIsDeleteOpen(false);
      setEditingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-muted-foreground">Gerencie as categorias de produtos do estoque</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={categories as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'description', label: 'Descrição' },
              { key: 'productsCount', label: 'Qtd Produtos' },
              { key: 'active', label: 'Ativa', format: (v) => v ? 'Sim' : 'Não' },
            ]}
            filename="categorias"
          />
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Categorias</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">{activeCategories} ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Em todas as categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Média por Categoria</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length > 0 ? Math.round(totalProducts / categories.length) : 0}</div>
            <p className="text-xs text-muted-foreground">Produtos por categoria</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar categorias..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map(category => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{category.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{category.productsCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={category.active ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground'}>
                        {category.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(category); setIsDeleteOpen(true); }}>
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Atualize os dados da categoria.' : 'Preencha os dados para criar uma nova categoria.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome da categoria" />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Descrição opcional" />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData(prev => ({ ...prev, active: checked }))} />
              <Label htmlFor="active">Categoria ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingCategory ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria "{editingCategory?.name}"?
              {editingCategory && editingCategory.productsCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Esta categoria possui {editingCategory.productsCount} produtos vinculados e não pode ser excluída.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
