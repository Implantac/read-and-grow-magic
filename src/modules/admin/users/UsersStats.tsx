import { Card, CardContent } from '@/ui/base/card';
import { Users as UsersIcon, UserCheck, UserPlus, UserX } from 'lucide-react';
import { SystemUser } from '@/types/administration';

interface UsersStatsProps {
  users: SystemUser[];
}

export const UsersStats = ({ users }: UsersStatsProps) => {
  const stats = {
    total: users?.length || 0,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    blocked: users.filter(u => u.status === 'blocked').length,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><UsersIcon className="h-5 w-5 text-primary" /></div>
        <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-100"><UserCheck className="h-5 w-5 text-green-600" /></div>
        <div><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold text-green-600">{stats.active}</p></div>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-yellow-100"><UserPlus className="h-5 w-5 text-yellow-600" /></div>
        <div><p className="text-sm text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></div>
      </CardContent></Card>
      <Card><CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-100"><UserX className="h-5 w-5 text-red-600" /></div>
        <div><p className="text-sm text-muted-foreground">Bloqueados</p><p className="text-2xl font-bold text-red-600">{stats.blocked}</p></div>
      </CardContent></Card>
    </div>
  );
};
