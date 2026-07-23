import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { Hammer, Package } from "lucide-react";
import type { KitRow } from "./types";

interface Props {
  kits: KitRow[];
  loading: boolean;
  onAssemble: (kit: KitRow) => void;
}

export function KitsTable({ kits, loading, onAssemble }: Props) {
  if (loading) return <p className="text-muted-foreground text-sm">Carregando…</p>;
  if (kits.length === 0)
    return (
      <EmptyState
        compact
        icon={Package}
        title="Nenhum kit cadastrado"
        description="Cadastre kits para agrupar componentes em SKUs pai montáveis."
      />
    );
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>SKU Pai</TableHead>
          <TableHead>Componentes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kits.map((k) => (
          <TableRow key={k.id}>
            <TableCell className="font-mono">{k.code}</TableCell>
            <TableCell>{k.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {k.parent ? `${k.parent.code} — ${k.parent.name}` : "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {(k.components ?? []).map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-xs">
                    {c.product?.code ?? "?"} × {c.quantity}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={k.active ? "default" : "outline"}>{k.active ? "Ativo" : "Inativo"}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" onClick={() => onAssemble(k)}>
                <Hammer className="h-4 w-4" /> Montar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
