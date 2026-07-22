import { Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { stockLevelStatusConfig } from '@/config/inventory';
import type { StockLevelFilters, StockLevelStatus } from '@/types/inventory';

interface Props {
  filters: StockLevelFilters;
  onChange: (f: StockLevelFilters) => void;
  categories: string[];
}

export function StockFiltersCard({ filters, onChange, categories }: Props) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" />Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou código..." value={filters.search} onChange={(e) => onChange({ ...filters, search: e.target.value })} className="pl-10" />
          </div>
          <Select value={filters.category} onValueChange={(value) => onChange({ ...filters, category: value })}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(value) => onChange({ ...filters, status: value as StockLevelStatus | 'all' })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {stockLevelStatusConfig.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
