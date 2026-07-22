import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';

type Props = {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  terminalFilter: string;
  onTerminalChange: (v: string) => void;
  terminals: string[];
};

export function NFCeFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  terminalFilter,
  onTerminalChange,
  terminals,
}: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente ou chave de acesso..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="authorized">Autorizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="contingency">Contingência</SelectItem>
            </SelectContent>
          </Select>
          <Select value={terminalFilter} onValueChange={onTerminalChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Terminal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos PDVs</SelectItem>
              {terminals.map((terminal) => (
                <SelectItem key={terminal} value={terminal}>
                  {terminal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
