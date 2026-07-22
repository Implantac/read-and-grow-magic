import { Search } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { ExportButton } from '@/shared/components/ExportButton';
import { formatBRL, formatDate } from '@/lib/formatters';

type Props = {
  searchTerm: string; onSearchChange: (v: string) => void;
  statusFilter: string; onStatusChange: (v: string) => void;
  categoryFilter: string; onCategoryChange: (v: string) => void;
  categories: string[];
  filteredAccounts: unknown[];
};

export function ReceivableFilters({ searchTerm, onSearchChange, statusFilter, onStatusChange, categoryFilter, onCategoryChange, categories, filteredAccounts }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por descrição, cliente ou documento..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
              <SelectItem value="overdue">Vencido</SelectItem>
              <SelectItem value="paid">Recebido</SelectItem>
              <SelectItem value="renegotiated">Renegociado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <ExportButton
            data={filteredAccounts as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'description', label: 'Descrição' },
              { key: 'client_name', label: 'Cliente' },
              { key: 'category', label: 'Categoria' },
              { key: 'due_date', label: 'Vencimento', format: (v) => formatDate(v as string) },
              { key: 'amount', label: 'Valor Original', format: (v) => formatBRL(Number(v)) },
              { key: 'open_amount', label: 'Em Aberto', format: (v) => formatBRL(Number(v ?? 0)) },
              { key: 'paid_amount', label: 'Pago', format: (v) => formatBRL(Number(v ?? 0)) },
              { key: 'status', label: 'Status' },
            ]}
            filename="contas_receber"
          />
        </div>
      </CardContent>
    </Card>
  );
}
