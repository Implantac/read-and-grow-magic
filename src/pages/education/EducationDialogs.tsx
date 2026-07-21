import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/base/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { Plus } from "lucide-react";

type SchoolForm = { name: string; inep_code: string; phone: string; email: string };
type ClassForm = {
  name: string;
  school_id: string;
  academic_year: number;
  grade: string;
  shift: "matutino" | "vespertino" | "noturno" | "integral";
  capacity: number;
};
type StudentForm = {
  full_name: string;
  document: string;
  guardian_name: string;
  guardian_phone: string;
  email: string;
};
type EnrollForm = { student_id: string; class_id: string; monthly_fee: number };

type OptionRow = { id: string; name?: string; full_name?: string; academic_year?: number };

export function SchoolDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SchoolForm;
  setForm: (f: SchoolForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { open, onOpenChange, form, setForm, onSubmit, isPending } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova escola
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova escola</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Código INEP</Label>
            <Input value={form.inep_code} onChange={(e) => setForm({ ...form, inep_code: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClassDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: ClassForm;
  setForm: (f: ClassForm) => void;
  onSubmit: () => void;
  isPending: boolean;
  schools: OptionRow[];
}) {
  const { open, onOpenChange, form, setForm, onSubmit, isPending, schools } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={schools.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nova turma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova turma</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Escola *</Label>
            <Select value={form.school_id} onValueChange={(v) => setForm({ ...form, school_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome da turma *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Série</Label>
              <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Ano letivo</Label>
              <Input
                type="number"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: Number(e.target.value) || new Date().getFullYear() })}
              />
            </div>
            <div>
              <Label>Turno</Label>
              <Select value={form.shift} onValueChange={(v) => setForm({ ...form, shift: v as ClassForm["shift"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="matutino">Matutino</SelectItem>
                  <SelectItem value="vespertino">Vespertino</SelectItem>
                  <SelectItem value="noturno">Noturno</SelectItem>
                  <SelectItem value="integral">Integral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capacidade</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StudentDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: StudentForm;
  setForm: (f: StudentForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { open, onOpenChange, form, setForm, onSubmit, isPending } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Novo aluno
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo aluno</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Documento</Label>
              <Input value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Responsável</Label>
              <Input value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
            </div>
            <div>
              <Label>Telefone do responsável</Label>
              <Input value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EnrollmentDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: EnrollForm;
  setForm: (f: EnrollForm) => void;
  onSubmit: () => void;
  isPending: boolean;
  students: OptionRow[];
  classes: OptionRow[];
}) {
  const { open, onOpenChange, form, setForm, onSubmit, isPending, students, classes } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={students.length === 0 || classes.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nova matrícula
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova matrícula</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Aluno *</Label>
            <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Turma *</Label>
            <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.academic_year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mensalidade (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.monthly_fee}
              onChange={(e) => setForm({ ...form, monthly_fee: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
