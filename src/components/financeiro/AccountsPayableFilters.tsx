import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportButton } from '@/components/shared/ExportButton';
import { formatDate } from '@/lib/formatters';

interface AccountsPayableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  filteredData: any[];
}

export function AccountsPayableFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  categories,
  filteredData
}: AccountsPayableFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Buscar por descrição, fornecedor ou documento..." 
          value={searchTerm} 
          onChange={(e) => onSearchChange(e.target.value)} 
          className="pl-9" 
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="partial">Parcial</SelectItem>
          <SelectItem value="overdue">Vencido</SelectItem>
          <SelectItem value="paid">Pago</SelectItem>
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
        data={filteredData as unknown as Record<string, unknown>[]}
        columns={[
          { key: 'description', label: 'Descrição' },
          { key: 'supplier', label: 'Fornecedor' },
          { key: 'category', label: 'Categoria' },
          { key: 'due_date', label: 'Vencimento', format: (v) => formatDate(v as string) },
          { key: 'amount', label: 'Valor' },
          { key: 'status', label: 'Status' }
        ]}
        filename="contas_a_pagar"
      />
    </div>
  );
}
