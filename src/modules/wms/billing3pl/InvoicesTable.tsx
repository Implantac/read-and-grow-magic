import { EmptyState } from "@/shared/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Contract, Invoice, brl } from "./types";

export function InvoicesTable({ invoices, contracts }: { invoices: Invoice[]; contracts: Contract[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturas recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <EmptyState compact title="Nenhuma fatura gerada" description="Gere a primeira fatura a partir de um contrato ativo." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Armazenagem</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Picking</TableHead>
                <TableHead>Packing</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((i) => {
                const c = contracts.find((x) => x.id === i.contract_id);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs">{i.period_start} → {i.period_end}</TableCell>
                    <TableCell>{c?.client_name || "—"}</TableCell>
                    <TableCell>{brl(i.storage_amount)}</TableCell>
                    <TableCell>{brl(i.inbound_amount)}</TableCell>
                    <TableCell>{brl(i.outbound_amount)}</TableCell>
                    <TableCell>{brl(i.picking_amount)}</TableCell>
                    <TableCell>{brl(i.packing_amount)}</TableCell>
                    <TableCell>{brl(i.minimum_adjustment)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{brl(i.total_amount)}</TableCell>
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
