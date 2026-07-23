import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Search } from 'lucide-react';

interface Props {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  workCenterFilter: string;
  setWorkCenterFilter: (v: string) => void;
  workCenters: (string | null)[];
}

export function TimeEntriesFilters({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, workCenterFilter, setWorkCenterFilter, workCenters }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por ordem, operação ou operador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="started">Em Andamento</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workCenterFilter} onValueChange={setWorkCenterFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Centro de Trabalho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Centros</SelectItem>
              {workCenters.map(wc => (
                <SelectItem key={wc!} value={wc!}>{wc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
