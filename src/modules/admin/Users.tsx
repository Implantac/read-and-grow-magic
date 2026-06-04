import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/ui/base/dialog';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Checkbox } from '@/ui/base/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/ui/base/table';
import { 
  Search, Plus, Edit2, Trash2, UserCheck, UserX, Shield, 
  Users as UsersIcon, UserPlus, Clock, MoreVertical, Key, Loader2,
  Phone, Building2, Mail, User, Briefcase, Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/ui/base/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  userStatusConfig, 
  userRoleConfig,
  defaultPermissions as mockPermissions
} from '@/config/administration';
import { SystemUser, UserRole, UserStatus, UserFilter } from '@/types/administration';
import { useUsers } from '@/hooks/system/useUsers';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const UsersPage = () => {
  const { users, isLoading, inviteUser, deleteUser, changeRole, toggleBan, resetPassword, isInviting, isChangingRole } = useUsers();
  
  const { data: companies } = useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, trade_name, name');
      if (error) throw error;
      return data;
    }
  });
  
  const [filter, setFilter] = useState<UserFilter>({ role: 'all', status: 'all' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  const stats = {
    total: users?.length || 0,
    active: (users as SystemUser[] || []).filter(u => u.status === 'active').length,
    pending: (users as SystemUser[] || []).filter(u => u.status === 'pending').length,
    blocked: (users as SystemUser[] || []).filter(u => u.status === 'blocked').length,
  };

  const filteredUsers = useMemo(() => {
    return (users as SystemUser[] || []).filter(user => {
      const matchesSearch = !filter.search || 
        user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.search.toLowerCase()) ||
        user.department?.toLowerCase().includes(filter.search.toLowerCase());
      const matchesRole = filter.role === 'all' || user.role === filter.role;
      const matchesStatus = filter.status === 'all' || user.status === filter.status;
      const matchesBranch = !filter.branchId || user.branchId === filter.branchId;
      return matchesSearch && matchesRole && matchesStatus && matchesBranch;
    });
  }, [users, filter]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleManagePermissions = (user: SystemUser) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleToggleStatus = async (user: SystemUser) => {
    try {
      const isBanned = user.status === 'blocked';
      await toggleBan({ user_id: user.id, banned: !isBanned });
      toast.success(`Usuário ${isBanned ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
    } catch (error) {
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleResetPassword = async (user: SystemUser) => {
    try {
      await resetPassword(user.email);
      toast.success(`Email de redefinição de senha enviado para ${user.email}`);
    } catch (error) {
      toast.error('Erro ao enviar email de redefinição');
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (confirm('Tem certeza que deseja excluir este usuário permanentemente?')) {
      try {
        await deleteUser(user.id);
        toast.success('Usuário excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir usuário');
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const role = formData.get('role') as UserRole;
    const phone = formData.get('phone') as string;
    const department = formData.get('department') as string;
    const branch_id = formData.get('branch_id') as string;
    
    try {
      if (editingUser) {
        await changeRole({ 
          user_id: editingUser.id, 
          role,
          phone,
          department,
          branch_id: branch_id || null
        });
        toast.success('Perfil atualizado com sucesso!');
      } else {
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        
        await inviteUser({ 
          email, 
          name, 
          role,
          phone,
          department,
          branch_id: branch_id || null
        });
        toast.success('Usuário convidado com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleSavePermissions = (permissions: string[]) => {
    if (!selectedUser) return;
    toast.info('Gestão de permissões será implementada em breve');
    setIsPermissionsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Gestão de Usuários" 
        description="Gerencie usuários e permissões do sistema"
      >
        <ExportButton
          data={filteredUsers as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'email', label: 'E-mail' },
            { key: 'role', label: 'Perfil' },
            { key: 'department', label: 'Departamento' },
            { key: 'status', label: 'Status' },
          ]}
          filename="usuarios"
        />
        <Button onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." className="pl-10" value={filter.search || ''} onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))} />
            </div>
            <Select value={filter.role || 'all'} onValueChange={(value) => setFilter(prev => ({ ...prev, role: value as UserRole | 'all' }))}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Perfil" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Perfis</SelectItem>
                {Object.entries(userRoleConfig).map(([key, config]) => (<SelectItem key={key} value={key}>{config.label}</SelectItem>))}
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
                <TableHead>Usuário</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <div><p className="font-medium">{user.name}</p><div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{user.email}</div></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${userRoleConfig[user.role as UserRole]?.bgColor || 'bg-gray-100'} ${userRoleConfig[user.role as UserRole]?.color || 'text-gray-700'} border-0`}>{userRoleConfig[user.role as UserRole]?.label || user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${userStatusConfig[user.status as UserStatus]?.bgColor || 'bg-gray-100'} ${userStatusConfig[user.status as UserStatus]?.color || 'text-gray-700'} border-0`}>{userStatusConfig[user.status as UserStatus]?.label || user.status}</Badge>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="h-3 w-3" />{user.lastLogin ? format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'Nunca'}</div></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}><Edit2 className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManagePermissions(user)}><Shield className="h-4 w-4 mr-2" />Permissões</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}><Key className="h-4 w-4 mr-2" />Redefinir Senha</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>{user.status === 'blocked' ? (<><UserCheck className="h-4 w-4 mr-2" />Desbloquear</>) : (<><UserX className="h-4 w-4 mr-2 text-red-600" /><span className="text-red-600">Bloquear</span></>)}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingUser(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2">{editingUser ? <Edit2 className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}{editingUser ? 'Editar Perfil' : 'Convidar Novo Usuário'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
            <div className="space-y-2"><Label htmlFor="name">Nome Completo *</Label><Input id="name" name="name" defaultValue={editingUser?.name} disabled={!!editingUser} required={!editingUser} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" defaultValue={editingUser?.email} disabled={!!editingUser} required={!editingUser} /></div>
            <div className="space-y-2"><Label htmlFor="role">Perfil *</Label><Select name="role" defaultValue={editingUser?.role || 'viewer'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(userRoleConfig).map(([key, config]) => (<SelectItem key={key} value={key}>{config.label}</SelectItem>))}</SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={isInviting || isChangingRole}>{(isInviting || isChangingRole) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingUser ? 'Salvar' : 'Convidar'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default UsersPage;
