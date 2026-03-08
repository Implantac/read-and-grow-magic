import { useState } from 'react';
import { ExportButton } from '@/components/shared/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Search, Plus, Edit2, Trash2, UserCheck, UserX, Shield, 
  Users as UsersIcon, UserPlus, Clock, MoreVertical, Key
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  userStatusConfig, 
  userRoleConfig,
  defaultPermissions as mockPermissions
} from '@/config/administration';
import { SystemUser, UserRole, UserStatus, UserFilter } from '@/types/administration';

const UsersPage = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [filter, setFilter] = useState<UserFilter>({ role: 'all', status: 'all' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    blocked: users.filter(u => u.status === 'blocked').length,
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !filter.search || 
      user.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filter.search.toLowerCase());
    const matchesRole = filter.role === 'all' || user.role === filter.role;
    const matchesStatus = filter.status === 'all' || user.status === filter.status;
    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const handleToggleStatus = (user: SystemUser) => {
    const newStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, status: newStatus, updatedAt: new Date().toISOString() } : u
    ));
    toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
  };

  const handleResetPassword = (user: SystemUser) => {
    toast.success(`Email de redefinição de senha enviado para ${user.email}`);
  };

  const handleDeleteUser = (user: SystemUser) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.success('Usuário excluído com sucesso!');
  };

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: Partial<SystemUser> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as UserRole,
      department: formData.get('department') as string,
      branchId: formData.get('branchId') as string,
      branchName: formData.get('branchId') as string,
    };

    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...userData, updatedAt: new Date().toISOString() } 
          : u
      ));
      toast.success('Usuário atualizado com sucesso!');
    } else {
      const newUser: SystemUser = {
        id: `USR${String(users.length + 1).padStart(3, '0')}`,
        ...userData as SystemUser,
        status: 'pending',
        permissions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers(prev => [...prev, newUser]);
      toast.success('Usuário criado com sucesso!');
    }
    
    setIsDialogOpen(false);
  };

  const handleSavePermissions = (permissions: string[]) => {
    if (!selectedUser) return;
    
    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { ...u, permissions, updatedAt: new Date().toISOString() } 
        : u
    ));
    toast.success('Permissões atualizadas com sucesso!');
    setIsPermissionsDialogOpen(false);
  };

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
                <TableHead>Perfil</TableHead>
                <TableHead>Filial</TableHead>
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
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${userRoleConfig[user.role].bgColor} ${userRoleConfig[user.role].color} border-0`}>
                      {userRoleConfig[user.role].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{user.branchName || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${userStatusConfig[user.status].bgColor} ${userStatusConfig[user.status].color} border-0`}>
                      {userStatusConfig[user.status].label}
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
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.status === 'active' ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingUser?.name}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  defaultValue={editingUser?.email}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  defaultValue={editingUser?.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select name="role" defaultValue={editingUser?.role || 'operator'}>
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
                <Label htmlFor="department">Departamento</Label>
                <Input 
                  id="department" 
                  name="department" 
                  defaultValue={editingUser?.department}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branchId">Filial</Label>
                <Select name="branchId" defaultValue={editingUser?.branchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCompanies.filter(c => c.status === 'active').map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.tradeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Salvar' : 'Criar Usuário'}
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
