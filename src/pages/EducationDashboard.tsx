import { useMemo, useState } from "react";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { KPICard } from "@/shared/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
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
import { Skeleton } from "@/ui/base/skeleton";
import { Badge } from "@/ui/base/badge";
import { Building2, GraduationCap, Users, Wallet, Plus, FileText, Loader2 } from "lucide-react";
import {
  useCreateClass,
  useCreateEnrollment,
  useCreateSchool,
  useCreateStudent,
  useEduClasses,
  useEduEnrollments,
  useEduSchools,
  useEduStudents,
  useGenerateEnrollmentInvoice,
} from "@/hooks/useEducation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { toastSuccess, toastError } from "@/lib/toastHelpers";

const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

export default function EducationDashboard() {
  const schools = useEduSchools();
  const classes = useEduClasses();
  const students = useEduStudents();
  const enrollments = useEduEnrollments();
  const createSchool = useCreateSchool();
  const createClass = useCreateClass();
  const createStudent = useCreateStudent();
  const createEnrollment = useCreateEnrollment();
  const generateInvoice = useGenerateEnrollmentInvoice();

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    student_id: "",
    class_id: "",
    monthly_fee: 0,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", inep_code: "", phone: "", email: "" });

  const [classOpen, setClassOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "",
    school_id: "",
    academic_year: new Date().getFullYear(),
    grade: "",
    shift: "matutino" as "matutino" | "vespertino" | "noturno" | "integral",
    capacity: 30,
  });

  const [studentOpen, setStudentOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    full_name: "",
    document: "",
    guardian_name: "",
    guardian_phone: "",
    email: "",
  });

  const activeEnrollments = useMemo(
    () => (enrollments.data ?? []).filter((e) => e.status === "active"),
    [enrollments.data],
  );
  const mrr = useMemo(
    () =>
      activeEnrollments.reduce((acc, e) => acc + Number(e.monthly_fee || 0), 0),
    [activeEnrollments],
  );

  async function handleCreate() {
    if (!form.name.trim()) {
      toastError("Informe o nome da escola.");
      return;
    }
    try {
      await createSchool.mutateAsync(form);
      toastSuccess("Escola criada com sucesso.");
      setOpen(false);
      setForm({ name: "", inep_code: "", phone: "", email: "" });
    } catch (e) {
      toastError("Não foi possível criar a escola.");
    }
  }

  async function handleCreateClass() {
    if (!classForm.name.trim() || !classForm.school_id) {
      toastError("Informe nome da turma e a escola.");
      return;
    }
    try {
      await createClass.mutateAsync(classForm);
      toastSuccess("Turma criada.");
      setClassOpen(false);
      setClassForm({
        name: "",
        school_id: "",
        academic_year: new Date().getFullYear(),
        grade: "",
        shift: "matutino",
        capacity: 30,
      });
    } catch {
      toastError("Não foi possível criar a turma.");
    }
  }

  async function handleCreateStudent() {
    if (!studentForm.full_name.trim()) {
      toastError("Informe o nome do aluno.");
      return;
    }
    try {
      await createStudent.mutateAsync(studentForm);
      toastSuccess("Aluno cadastrado.");
      setStudentOpen(false);
      setStudentForm({
        full_name: "",
        document: "",
        guardian_name: "",
        guardian_phone: "",
        email: "",
      });
    } catch {
      toastError("Não foi possível cadastrar o aluno.");
    }
  }

  async function handleCreateEnrollment() {
    if (!enrollForm.student_id || !enrollForm.class_id) {
      toastError("Selecione aluno e turma.");
      return;
    }
    try {
      await createEnrollment.mutateAsync(enrollForm);
      toastSuccess("Matrícula registrada.");
      setEnrollOpen(false);
      setEnrollForm({ student_id: "", class_id: "", monthly_fee: 0 });
    } catch {
      toastError("Não foi possível registrar a matrícula.");
    }
  }

  const [bulkRunning, setBulkRunning] = useState(false);
  async function handleBulkGenerate() {
    if (activeEnrollments.length === 0) return;
    setBulkRunning(true);
    let ok = 0;
    let skip = 0;
    let fail = 0;
    for (const en of activeEnrollments) {
      const aluno = (students.data ?? []).find((s) => s.id === en.student_id);
      const turma = (classes.data ?? []).find((c) => c.id === en.class_id);
      if (!aluno || !turma) {
        fail++;
        continue;
      }
      try {
        await generateInvoice.mutateAsync({
          enrollment: en,
          studentName: aluno.full_name,
          className: turma.name,
        });
        ok++;
      } catch (e: any) {
        if (String(e?.message ?? "").includes("já foi gerada")) skip++;
        else fail++;
      }
    }
    setBulkRunning(false);
    if (ok > 0) toastSuccess(`${ok} mensalidade(s) geradas. ${skip} já existiam. ${fail} falhas.`);
    else toastError(`Nenhuma gerada. ${skip} já existiam. ${fail} falhas.`);
  }
    <PageContainer>
      <PageHeader
        title="Educação"
        description="Gestão de escolas, turmas, alunos e matrículas."
        actions={
          <div className="flex gap-2 flex-wrap">
            <Dialog open={open} onOpenChange={setOpen}>
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
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Código INEP</Label>
                    <Input
                      value={form.inep_code}
                      onChange={(e) => setForm({ ...form, inep_code: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createSchool.isPending}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={classOpen} onOpenChange={setClassOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={(schools.data ?? []).length === 0}>
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
                    <Select
                      value={classForm.school_id}
                      onValueChange={(v) => setClassForm({ ...classForm, school_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escola" />
                      </SelectTrigger>
                      <SelectContent>
                        {(schools.data ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome da turma *</Label>
                      <Input
                        value={classForm.name}
                        onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Série</Label>
                      <Input
                        value={classForm.grade}
                        onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Ano letivo</Label>
                      <Input
                        type="number"
                        value={classForm.academic_year}
                        onChange={(e) =>
                          setClassForm({ ...classForm, academic_year: Number(e.target.value) || new Date().getFullYear() })
                        }
                      />
                    </div>
                    <div>
                      <Label>Turno</Label>
                      <Select
                        value={classForm.shift}
                        onValueChange={(v) =>
                          setClassForm({ ...classForm, shift: v as typeof classForm.shift })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
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
                        value={classForm.capacity}
                        onChange={(e) =>
                          setClassForm({ ...classForm, capacity: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setClassOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateClass} disabled={createClass.isPending}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
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
                    <Input
                      value={studentForm.full_name}
                      onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Documento</Label>
                      <Input
                        value={studentForm.document}
                        onChange={(e) => setStudentForm({ ...studentForm, document: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={studentForm.email}
                        onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Responsável</Label>
                      <Input
                        value={studentForm.guardian_name}
                        onChange={(e) => setStudentForm({ ...studentForm, guardian_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Telefone do responsável</Label>
                      <Input
                        value={studentForm.guardian_phone}
                        onChange={(e) => setStudentForm({ ...studentForm, guardian_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStudentOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateStudent} disabled={createStudent.isPending}>
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  disabled={
                    (students.data ?? []).length === 0 ||
                    (classes.data ?? []).length === 0
                  }
                >
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
                    <Select
                      value={enrollForm.student_id}
                      onValueChange={(v) => setEnrollForm({ ...enrollForm, student_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {(students.data ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Turma *</Label>
                    <Select
                      value={enrollForm.class_id}
                      onValueChange={(v) => setEnrollForm({ ...enrollForm, class_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {(classes.data ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.academic_year})
                          </SelectItem>
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
                      value={enrollForm.monthly_fee}
                      onChange={(e) =>
                        setEnrollForm({
                          ...enrollForm,
                          monthly_fee: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEnrollOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateEnrollment}
                    disabled={createEnrollment.isPending}
                  >
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Escolas"
          value={(schools.data?.length ?? 0).toString()}
          icon={Building2}
        />
        <KPICard
          title="Turmas"
          value={(classes.data?.length ?? 0).toString()}
          icon={GraduationCap}
        />
        <KPICard
          title="Alunos"
          value={(students.data?.length ?? 0).toString()}
          icon={Users}
        />
        <KPICard
          title="Receita mensal estimada"
          value={formatCurrencyPtBr(mrr)}
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escolas / unidades</CardTitle>
        </CardHeader>
        <CardContent>
          {schools.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (schools.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma escola cadastrada. Crie a primeira para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>INEP</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Turmas</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(schools.data ?? []).map((s) => {
                  const turmas = (classes.data ?? []).filter(
                    (c) => c.school_id === s.id,
                  ).length;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs">{s.inep_code ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[s.phone, s.email].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">{turmas}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.is_active ? "default" : "secondary"}>
                          {s.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Turmas e ocupação</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (classes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma turma cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Ano / Turno</TableHead>
                  <TableHead className="text-right">Ocupação</TableHead>
                  <TableHead className="text-right">Receita projetada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(classes.data ?? []).map((c) => {
                  const inscritos = activeEnrollments.filter((e) => e.class_id === c.id);
                  const receita = inscritos.reduce(
                    (acc, e) => acc + Number(e.monthly_fee || 0),
                    0,
                  );
                  const escola = (schools.data ?? []).find((s) => s.id === c.school_id);
                  const pct = c.capacity
                    ? Math.round((inscritos.length / c.capacity) * 100)
                    : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {escola?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        {c.academic_year} · {c.shift}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={pct >= 90 ? "destructive" : pct >= 60 ? "default" : "secondary"}>
                          {inscritos.length}/{c.capacity ?? 0} ({pct}%)
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyPtBr(receita)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Matrículas ativas</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : activeEnrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem matrículas ativas no momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead className="text-right">Mensalidade</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnrollments.map((en) => {
                  const aluno = (students.data ?? []).find(
                    (s) => s.id === en.student_id,
                  );
                  const turma = (classes.data ?? []).find(
                    (c) => c.id === en.class_id,
                  );
                  return (
                    <TableRow key={en.id}>
                      <TableCell className="font-medium">
                        {aluno?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {turma ? `${turma.name} (${turma.academic_year})` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(en.enrolled_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyPtBr(Number(en.monthly_fee))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generateInvoice.isPending || !aluno || !turma}
                          onClick={async () => {
                            try {
                              await generateInvoice.mutateAsync({
                                enrollment: en,
                                studentName: aluno?.full_name ?? "Aluno",
                                className: turma?.name ?? "Turma",
                              });
                              toastSuccess("Mensalidade gerada no contas a receber.");
                            } catch (e: any) {
                              toastError(e?.message ?? "Não foi possível gerar a mensalidade.");
                            }
                          }}
                        >
                          Gerar mensalidade
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
