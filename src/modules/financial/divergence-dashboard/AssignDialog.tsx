import { Button } from '@/ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import type { CompanyUser, Notif } from './types';

interface Props {
  target: Notif | null;
  onClose: () => void;
  assignUser: string; setAssignUser: (v: string) => void;
  assignDueAt: string; setAssignDueAt: (v: string) => void;
  companyUsers: CompanyUser[];
  onSave: (id: string | null, dueAt: string | null) => void;
  isPending: boolean;
}

export function AssignDialog({ target, onClose, assignUser, setAssignUser, assignDueAt, setAssignDueAt, companyUsers, onSave, isPending }: Props) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Atribuir responsável e SLA</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={assignUser} onValueChange={setAssignUser}>
              <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
              <SelectContent>
                {companyUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name ?? u.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prazo (SLA)</Label>
            <Input type="datetime-local" value={assignDueAt} onChange={(e) => setAssignDueAt(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="outline" disabled={isPending} onClick={() => onSave(null, null)}>Remover atribuição</Button>
          <Button disabled={isPending || !assignUser} onClick={() => onSave(assignUser || null, assignDueAt ? new Date(assignDueAt).toISOString() : null)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
