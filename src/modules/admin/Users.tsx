import { useState, useMemo } from 'react';
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

  // Stats
  const stats = {
    total: users?.length || 0,
    active: (users as SystemUser[] || []).filter(u => u.status === 'active').length,
    pending: (users as SystemUser[] || []).filter(u => u.status === 'pending').length,
    blocked: (users as SystemUser[] || []).filter(u => u.status === 'blocked').length,
  };


  // Filter users
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
    toast.info('Gestão de permissões será implementada em breve', {
      description: 'Atualmente o acesso é controlado pelos perfis (roles).'
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UsersIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <UserPlus className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
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
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Perfis</SelectItem>
                {Object.entries(userRoleConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filter.branchId || 'all'}
              onValueChange={(value) => setFilter(prev => ({ ...prev, branchId: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Filiais</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.trade_name || company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filter.status || 'all'}
              onValueChange={(value) => setFilter(prev => ({ ...prev, status: value as UserStatus | 'all' }))}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {Object.entries(userStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
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
                        <span className="text-sm font-medium text-primary">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className={`${userRoleConfig[user.role as UserRole]?.bgColor || 'bg-gray-100'} ${userRoleConfig[user.role as UserRole]?.color || 'text-gray-700'} border-0`}>
                          {userRoleConfig[user.role as UserRole]?.label || user.role}
                        </Badge>

                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {user.department && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {user.department}
                          </span>
                        )}
                        {user.branchId && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {companies?.find(c => c.id === user.branchId)?.trade_name || 'Unidade'}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${userStatusConfig[user.status as UserStatus]?.bgColor || 'bg-gray-100'} ${userStatusConfig[user.status as UserStatus]?.color || 'text-gray-700'} border-0`}>
                      {userStatusConfig[user.status as UserStatus]?.label || user.status}
                    </Badge>

                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {user.lastLogin 
                        ? format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : 'Nunca'
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Permissões
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <Key className="h-4 w-4 mr-2" />
                          Redefinir Senha
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.status === 'blocked' ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-2 text-red-600" />
                              <span className="text-red-600">Bloquear</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          setEditingUser(null);
        } else {
          setIsDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUser ? <Edit2 className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingUser ? 'Editar Perfil do Usuário' : 'Convidar Novo Usuário'}
            </DialogTitle>
            {!editingUser && (
              <DialogDescription>
                Um convite será enviado para o email informado para que o usuário defina sua senha.
              </DialogDescription>
            )}
          </DialogHeader>
          
          <form onSubmit={handleSaveUser}>
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                <TabsTrigger value="access">Acesso e Organização</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Nome Completo *
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={editingUser?.name}
                      disabled={!!editingUser}
                      required={!editingUser}
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email *
                    </Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email"
                      defaultValue={editingUser?.email}
                      disabled={!!editingUser}
                      required={!editingUser}
                      placeholder="joao.silva@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Telefone
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      defaultValue={editingUser?.phone}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="access" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Perfil de Acesso *
                    </Label>
                    <Select name="role" defaultValue={editingUser?.role || 'viewer'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(userRoleConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Departamento
                    </Label>
                    <Input 
                      id="department" 
                      name="department" 
                      defaultValue={editingUser?.department}
                      placeholder="Ex: Financeiro, TI, Vendas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch_id" className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      Filial / Unidade
                    </Label>
                    <Select name="branch_id" defaultValue={editingUser?.branchId || undefined}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies?.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.trade_name || company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isInviting || isChangingRole}>
                {(isInviting || isChangingRole) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingUser ? 'Salvar Alterações' : 'Convidar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Permissões - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <PermissionsEditor 
              currentPermissions={selectedUser.permissions}
              onSave={handleSavePermissions}
              onCancel={() => setIsPermissionsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Permissions Editor Component
interface PermissionsEditorProps {
  currentPermissions: string[];
  onSave: (permissions: string[]) => void;
  onCancel: () => void;
}

const PermissionsEditor = ({ currentPermissions, onSave, onCancel }: PermissionsEditorProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(currentPermissions);
  
  const permissionsByModule = mockPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof mockPermissions>);

  const togglePermission = (code: string) => {
    setSelectedPermissions(prev => 
      prev.includes(code) 
        ? prev.filter(p => p !== code)
        : [...prev, code]
    );
  };

  const toggleModule = (moduleName: string, permissions: typeof mockPermissions) => {
    const moduleCodes = permissions.map(p => p.code);
    const allSelected = moduleCodes.every(code => selectedPermissions.includes(code));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !moduleCodes.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...moduleCodes])]);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(permissionsByModule).map(([module, permissions]) => {
        const moduleCodes = permissions.map(p => p.code);
        const allSelected = moduleCodes.every(code => selectedPermissions.includes(code));
        const someSelected = moduleCodes.some(code => selectedPermissions.includes(code));
        
        return (
          <div key={module} className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                id={`module-${module}`}
                checked={allSelected}
                onCheckedChange={() => toggleModule(module, permissions)}
                className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
              />
              <Label htmlFor={`module-${module}`} className="font-semibold">
                {module}
              </Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
              {permissions.map(perm => (
                <div key={perm.id} className="flex items-start gap-2">
                  <Checkbox 
                    id={perm.id}
                    checked={selectedPermissions.includes(perm.code)}
                    onCheckedChange={() => togglePermission(perm.code)}
                  />
                  <div>
                    <Label htmlFor={perm.id} className="text-sm font-normal">
                      {perm.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(selectedPermissions)}>
          Salvar Permissões
        </Button>
      </DialogFooter>
    </div>
  );
};

export default UsersPage;
