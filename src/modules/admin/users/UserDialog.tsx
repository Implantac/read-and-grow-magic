import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { UserPlus, Edit2, Loader2 } from 'lucide-react';
import { SystemUser, UserRole } from '@/types/administration';
import { userRoleConfig } from '@/config/administration';
import { useUsers } from '@/hooks/system/useUsers';
import { useBranches } from '@/hooks/useBranches';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: SystemUser | null;
}

export const UserDialog = ({ open, onOpenChange, editingUser }: UserDialogProps) => {
  const { inviteUser, changeRole, isInviting, isChangingRole } = useUsers();
  const { data: branches = [] } = useBranches();

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const role = formData.get('role') as UserRole;
    const phone = formData.get('phone') as string;
    const department = formData.get('department') as string;
    const rawBranch = formData.get('branch_id') as string;
    const branch_id = rawBranch && rawBranch !== 'none' ? rawBranch : '';
    
    try {
      if (editingUser) {
        await changeRole({ 
          user_id: editingUser.id, 
          role,
          phone,
          department,
          branch_id: branch_id || null
        });
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
      }
      onOpenChange(false);
    } catch (error: any) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingUser ? <Edit2 className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
            {editingUser ? 'Editar Perfil' : 'Convidar Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input id="name" name="name" defaultValue={editingUser?.name} disabled={!!editingUser} required={!editingUser} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" defaultValue={editingUser?.email} disabled={!!editingUser} required={!editingUser} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Perfil *</Label>
            <Select name="role" defaultValue={editingUser?.role || 'viewer'}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(userRoleConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input id="department" name="department" defaultValue={editingUser?.department} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={editingUser?.phone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch_id">Filial de acesso</Label>
            <Select name="branch_id" defaultValue={editingUser?.branchId || 'none'}>
              <SelectTrigger><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem filial (apenas gestores da matriz veem tudo) —</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Operadores/vendedores só enxergam dados da filial atribuída. Escolha <strong>Admin Matriz</strong> no perfil para visão consolidada de todas as filiais.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isInviting || isChangingRole}>
              {(isInviting || isChangingRole) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? 'Salvar' : 'Convidar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
