import { EmptyState } from "@/shared/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { FileText, Receipt } from "lucide-react";
import { Contract, brl } from "./types";

interface Props {
  loading: boolean;
  contracts: Contract[];
  onGenerate: (c: Contract) => void;
}

export function ContractsTable({ loading, contracts, onGenerate }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Contratos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : contracts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum contrato cadastrado"
            description="Cadastre contratos 3PL para gerar faturas por armazenagem, entradas, saídas, picking e packing."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Armaz. (pallet/dia)</TableHead>
                <TableHead>Entrada (un)</TableHead>
                <TableHead>Saída (un)</TableHead>
                <TableHead>Picking (linha)</TableHead>
                <TableHead>Packing (pedido)</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.client_name}</TableCell>
                  <TableCell>{brl(c.storage_rate_per_pallet_day)}</TableCell>
                  <TableCell>{brl(c.inbound_rate_per_unit)}</TableCell>
                  <TableCell>{brl(c.outbound_rate_per_unit)}</TableCell>
                  <TableCell>{brl(c.picking_rate_per_line)}</TableCell>
                  <TableCell>{brl(c.packing_rate_per_order)}</TableCell>
                  <TableCell>{brl(c.minimum_monthly_fee)}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => onGenerate(c)}>
                      <Receipt className="h-4 w-4 mr-1" /> Gerar fatura
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
