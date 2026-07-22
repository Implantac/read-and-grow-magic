import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";

type School = { id: string; name: string; inep_code?: string | null; phone?: string | null; email?: string | null; is_active?: boolean };
type Klass = { id: string; school_id: string };

export function SchoolsTable({ schools, classes, isLoading }: { schools: School[]; classes: Klass[]; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>Escolas / unidades</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : schools.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma escola cadastrada. Crie a primeira para começar.</p>
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
              {schools.map((s) => {
                const turmas = classes.filter((c) => c.school_id === s.id).length;
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
  );
}
