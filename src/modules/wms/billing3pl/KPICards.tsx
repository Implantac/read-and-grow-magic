import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Contract, Invoice, brl } from "./types";

export function KPICards({ contracts, invoices, totalMTD }: { contracts: Contract[]; invoices: Invoice[]; totalMTD: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Contratos ativos</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">
          {contracts.filter((c) => c.status === "active").length}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Faturas emitidas</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{invoices.length}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Faturado no mês</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold text-primary">{brl(totalMTD)}</CardContent>
      </Card>
    </div>
  );
}
