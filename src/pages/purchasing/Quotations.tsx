import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Send, Clock, Loader2 } from 'lucide-react';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatDate, formatBRL } from '@/lib/formatters';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { Badge } from '@/ui/base/badge';
import { quotationStatuses } from '@/config/purchasing';
import { usePurchasing } from '@/hooks/purchasing/usePurchasingQuery';
import { EmptyState } from '@/shared/components/EmptyState';
import { FileSearch } from 'lucide-react';

const priorityConfig: any = {
  low: { label: 'Baixa', className: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Média', className: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
};

export default function QuotationsPage() {
  const { quotations, quotationsLoading: loading } = usePurchasing();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredQuotations = useMemo(() => quotations.filter((quotation) => {
    const matchesSearch =
      quotation.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || quotation.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [quotations, searchTerm, statusFilter, priorityFilter]);

  const summaryData = useMemo(() => ({
    total: quotations.length,
    draft: quotations.filter((q) => q.status === 'draft').length,
    inProgress: quotations.filter((q) => ['sent', 'in_progress'].includes(q.status)).length,
    completed: quotations.filter((q) => q.status === 'completed').length,
  }), [quotations]);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

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
        <Button onClick={() => {}}><Plus className="mr-2 h-4 w-4" />Nova Cotação</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPICard title="Total" value={String(summaryData.total)} icon={<FileText className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Rascunhos" value={String(summaryData.draft)} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Em Andamento" value={String(summaryData.inProgress)} icon={<Send className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Concluídas" value={String(summaryData.completed)} icon={<Plus className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

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
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(quotationStatuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
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
                <TableHead>Número</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState icon={FileSearch} title="Nenhuma cotação" description="Solicite cotações para comparar preços entre fornecedores." />
                  </TableCell>
                </TableRow>
              ) : filteredQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-medium">{quotation.number}</TableCell>
                  <TableCell>{quotation.title}</TableCell>
                  <TableCell>{formatDate(quotation.date)}</TableCell>
                  <TableCell>
                    <Badge className={priorityConfig[quotation.priority]?.className || ''}>
                      {priorityConfig[quotation.priority]?.label || quotation.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={quotationStatuses[quotation.status]?.color || ''}>
                      {quotationStatuses[quotation.status]?.label || quotation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {}}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

import { KPICard } from '@/shared/components/KPICard';
import { FileText } from 'lucide-react';
