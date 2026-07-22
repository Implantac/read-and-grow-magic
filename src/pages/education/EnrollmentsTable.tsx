import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Button } from "@/ui/base/button";
import { Skeleton } from "@/ui/base/skeleton";
import { toastSuccess, toastError } from "@/lib/toastHelpers";

const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

type Enrollment = { id: string; student_id: string; class_id: string; enrolled_at: string; monthly_fee: number | string };
type Student = { id: string; full_name: string };
type Klass = { id: string; name: string; academic_year: number };

export function EnrollmentsTable({ activeEnrollments, students, classes, isLoading, generateInvoice }: {
  activeEnrollments: Enrollment[]; students: Student[]; classes: Klass[]; isLoading: boolean;
  generateInvoice: { isPending: boolean; mutateAsync: (args: { enrollment: Enrollment; studentName: string; className: string }) => Promise<unknown> };
}) {
  return (
    <Card>
      <CardHeader><CardTitle>Matrículas ativas</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : activeEnrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem matrículas ativas no momento.</p>
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
                const aluno = students.find((s) => s.id === en.student_id);
                const turma = classes.find((c) => c.id === en.class_id);
                return (
                  <TableRow key={en.id}>
                    <TableCell className="font-medium">{aluno?.full_name ?? "—"}</TableCell>
                    <TableCell>{turma ? `${turma.name} (${turma.academic_year})` : "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(en.enrolled_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{formatCurrencyPtBr(Number(en.monthly_fee))}</TableCell>
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
                          } catch (e: unknown) {
                            const msg = e instanceof Error ? e.message : "Não foi possível gerar a mensalidade.";
                            toastError(msg);
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
  );
}
