import { Card, CardContent } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Search } from 'lucide-react';
import { UserFilter, UserRole } from '@/types/administration';
import { userRoleConfig } from '@/config/administration';

interface UsersFiltersProps {
  filter: UserFilter;
  setFilter: React.Dispatch<React.SetStateAction<UserFilter>>;
}

export const UsersFilters = ({ filter, setFilter }: UsersFiltersProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou email..." 
              className="pl-10" 
              value={filter.search || ''} 
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))} 
            />
          </div>
          <Select 
            value={filter.role || 'all'} 
            onValueChange={(value) => setFilter(prev => ({ ...prev, role: value as UserRole | 'all' }))}
          >
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Perfil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Perfis</SelectItem>
              {Object.entries(userRoleConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
