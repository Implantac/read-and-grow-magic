import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";

const formatCurrencyPtBr = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

type Klass = { id: string; name: string; school_id: string; academic_year: number; shift: string; capacity?: number | null };
type School = { id: string; name: string };
type Enrollment = { class_id: string; monthly_fee: number | string };

export function ClassesTable({ classes, schools, activeEnrollments, isLoading }: {
  classes: Klass[]; schools: School[]; activeEnrollments: Enrollment[]; isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>Turmas e ocupação</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma turma cadastrada.</p>
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
              {classes.map((c) => {
                const inscritos = activeEnrollments.filter((e) => e.class_id === c.id);
                const receita = inscritos.reduce((acc, e) => acc + Number(e.monthly_fee || 0), 0);
                const escola = schools.find((s) => s.id === c.school_id);
                const pct = c.capacity ? Math.round((inscritos.length / c.capacity) * 100) : 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{escola?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs capitalize">{c.academic_year} · {c.shift}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={pct >= 90 ? "destructive" : pct >= 60 ? "default" : "secondary"}>
                        {inscritos.length}/{c.capacity ?? 0} ({pct}%)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrencyPtBr(receita)}</TableCell>
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
