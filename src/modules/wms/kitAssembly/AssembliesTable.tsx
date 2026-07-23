import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Badge } from "@/ui/base/badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { History } from "lucide-react";
import type { Assembly } from "./types";

export function AssembliesTable({ assemblies }: { assemblies: Assembly[] }) {
  if (assemblies.length === 0)
    return (
      <EmptyState
        compact
        icon={History}
        title="Nenhuma montagem registrada"
        description="As montagens realizadas aparecerão aqui com data, kit e quantidade."
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Kit</TableHead>
          <TableHead>Qtde</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assemblies.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="text-sm">{new Date(a.created_at).toLocaleString("pt-BR")}</TableCell>
            <TableCell>
              {a.kit?.code} — {a.kit?.name}
            </TableCell>
            <TableCell>{a.quantity}</TableCell>
            <TableCell>
              <Badge variant={a.status === "completed" ? "default" : "outline"}>{a.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
