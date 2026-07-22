import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { Filter, Search } from 'lucide-react';
import { movementTypeConfig } from '@/config/inventory';
import type { MovementDirection, MovementFilters, MovementType } from '@/types/inventory';

interface Props {
  filters: MovementFilters;
  setFilters: (f: MovementFilters) => void;
}

export function MovementsFiltersCard({ filters, setFilters }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.type}
            onValueChange={(value) =>
              setFilters({ ...filters, type: value as MovementType | 'all' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {movementTypeConfig.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.direction}
            onValueChange={(value) =>
              setFilters({ ...filters, direction: value as MovementDirection | 'all' })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Direção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="in">Entradas</SelectItem>
              <SelectItem value="out">Saídas</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
