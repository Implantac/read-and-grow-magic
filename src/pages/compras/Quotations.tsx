import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Send, CheckCircle, Users, Clock, FileCheck } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { quotationStatuses } from '@/config/purchasing';
import { Quotation, QuotationStatus, QuotationSupplier } from '@/types/purchasing';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Média', className: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
};

const supplierStatusConfig = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
  responded: { label: 'Respondida', className: 'bg-green-100 text-green-800' },
  declined: { label: 'Recusada', className: 'bg-red-100 text-red-800' },
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || quotation.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const summaryData = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === 'draft').length,
    inProgress: quotations.filter((q) => ['sent', 'in_progress'].includes(q.status)).length,
    completed: quotations.filter((q) => q.status === 'completed').length,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsViewOpen(true);
  };

  const handleCompare = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsCompareOpen(true);
  };

  const handleStatusChange = (quotationId: string, newStatus: QuotationStatus) => {
    setQuotations(
      quotations.map((q) =>
        q.id === quotationId ? { ...q, status: newStatus, updatedAt: new Date().toISOString() } : q
      )
    );
  };

  const handleSelectSupplier = (quotationId: string, supplierId: string) => {
    setQuotations(
      quotations.map((q) =>
        q.id === quotationId
          ? { ...q, selectedSupplierId: supplierId, status: 'completed', updatedAt: new Date().toISOString() }
          : q
      )
    );
    setIsCompareOpen(false);
  };

  const handleDelete = (id: string) => {
    setQuotations(quotations.filter((q) => q.id !== id));
  };

  const getResponseStats = (suppliers: QuotationSupplier[]) => {
    const responded = suppliers.filter((s) => s.status === 'responded').length;
    const total = suppliers.length;
    return `${responded}/${total}`;
  };

  const getBestPrice = (quotation: Quotation) => {
    const respondedSuppliers = quotation.suppliers.filter(
      (s) => s.status === 'responded' && s.totalValue
    );
    if (respondedSuppliers.length === 0) return null;
    return Math.min(...respondedSuppliers.map((s) => s.totalValue!));
  };

  return (
    <PageContainer>
      <PageHeader title="Cotações" description="Gerencie as cotações de compra">
        <ExportButton
          data={filteredQuotations as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Número' },
            { key: 'title', label: 'Título' },
            { key: 'date', label: 'Data', format: (v) => formatDate(v as string) },
            { key: 'status', label: 'Status' },
            { key: 'priority', label: 'Prioridade' },
          ]}
          filename="cotacoes_compra"
        />
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cotação
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
            <CardTitle className="text-sm font-medium text-gray-600">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{summaryData.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summaryData.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryData.completed}</div>
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
                  placeholder="Buscar por número ou título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(quotationStatuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
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
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Fornecedores</TableHead>
                <TableHead>Melhor Preço</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((quotation) => {
                const bestPrice = getBestPrice(quotation);
                return (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quotation.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {quotation.items.length} itens
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(quotation.date)}</TableCell>
                    <TableCell>{formatDate(quotation.deadline)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{getResponseStats(quotation.suppliers)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {bestPrice ? formatCurrency(bestPrice) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityConfig[quotation.priority].className}>
                        {priorityConfig[quotation.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={quotationStatuses[quotation.status].color}>
                        {quotationStatuses[quotation.status].label}
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
                          <DropdownMenuItem onClick={() => handleView(quotation)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {quotation.status === 'in_progress' && (
                            <DropdownMenuItem onClick={() => handleCompare(quotation)}>
                              <FileCheck className="mr-2 h-4 w-4" />
                              Comparar Propostas
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {quotation.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(quotation.id, 'sent')}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Enviar aos Fornecedores
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(quotation.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredQuotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    Nenhuma cotação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Cotação</DialogTitle>
          </DialogHeader>
          {selectedQuotation && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="items">Itens</TabsTrigger>
                <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedQuotation.number}</h3>
                    <p className="text-lg">{selectedQuotation.title}</p>
                    {selectedQuotation.description && (
                      <p className="text-muted-foreground mt-1">{selectedQuotation.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={priorityConfig[selectedQuotation.priority].className}>
                      {priorityConfig[selectedQuotation.priority].label}
                    </Badge>
                    <Badge className={quotationStatuses[selectedQuotation.status].color}>
                      {quotationStatuses[selectedQuotation.status].label}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Data Abertura</p>
                      <p className="font-medium">{formatDate(selectedQuotation.date)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Prazo Limite</p>
                      <p className="font-medium">{formatDate(selectedQuotation.deadline)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Comprador</p>
                      <p className="font-medium">{selectedQuotation.buyerName}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">Respostas</p>
                      <p className="font-medium">
                        {getResponseStats(selectedQuotation.suppliers)} fornecedores
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedQuotation.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p>{selectedQuotation.notes}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Especificações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>{item.specifications || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="suppliers" className="space-y-4">
                {selectedQuotation.suppliers.map((supplier) => (
                  <Card key={supplier.supplierId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{supplier.supplierName}</CardTitle>
                        <Badge className={supplierStatusConfig[supplier.status].className}>
                          {supplierStatusConfig[supplier.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    {supplier.status === 'responded' && supplier.items && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Valor Total</p>
                            <p className="text-lg font-bold">
                              {formatCurrency(supplier.totalValue || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Prazo Entrega</p>
                            <p className="font-medium">{supplier.deliveryTime} dias</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Cond. Pagamento</p>
                            <p className="font-medium">{supplier.paymentTerms}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Validade</p>
                            <p className="font-medium">
                              {supplier.validUntil ? formatDate(supplier.validUntil) : '-'}
                            </p>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="text-right">Preço Unit.</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead>Disponível</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplier.items.map((item) => {
                              const quotationItem = selectedQuotation.items.find(
                                (qi) => qi.id === item.itemId
                              );
                              return (
                                <TableRow key={item.itemId}>
                                  <TableCell>
                                    {quotationItem?.productName || item.itemId}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.unitPrice)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.total)}
                                  </TableCell>
                                  <TableCell>
                                    {item.available ? (
                                      <Badge className="bg-green-100 text-green-800">Sim</Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800">Não</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparar Propostas</DialogTitle>
            <DialogDescription>
              Selecione o fornecedor vencedor para esta cotação
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Prazo Entrega</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedQuotation.suppliers
                    .filter((s) => s.status === 'responded')
                    .sort((a, b) => (a.totalValue || 0) - (b.totalValue || 0))
                    .map((supplier, index) => (
                      <TableRow key={supplier.supplierId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <Badge className="bg-green-100 text-green-800">Menor Preço</Badge>
                            )}
                            <span className="font-medium">{supplier.supplierName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(supplier.totalValue || 0)}
                        </TableCell>
                        <TableCell className="text-right">{supplier.deliveryTime} dias</TableCell>
                        <TableCell>{supplier.paymentTerms}</TableCell>
                        <TableCell>
                          {supplier.validUntil ? formatDate(supplier.validUntil) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleSelectSupplier(selectedQuotation.id, supplier.supplierId)
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Selecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompareOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
