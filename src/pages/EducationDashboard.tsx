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
import { Building2, GraduationCap, Users, Wallet, Plus } from "lucide-react";
import {
  useCreateSchool,
  useEduClasses,
  useEduEnrollments,
  useEduSchools,
  useEduStudents,
} from "@/hooks/useEducation";
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

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", inep_code: "", phone: "", email: "" });

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

  return (
    <PageContainer>
      <PageHeader
        title="Educação"
        description="Gestão de escolas, turmas, alunos e matrículas."
        actions={
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
