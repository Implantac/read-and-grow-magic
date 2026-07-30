import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/base/table";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { Receipt, ExternalLink } from "lucide-react";
import { useSubscriptionInvoices } from "@/hooks/system/useSubscriptionInvoices";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Aguardando pagamento", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "outline" },
};

export function SubscriptionInvoicesCard() {
  const { data: invoices = [], isLoading } = useSubscriptionInvoices();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> Faturas da assinatura
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma fatura emitida"
            description="As faturas aparecem aqui assim que uma assinatura é contratada."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emissão</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const st = statusLabel[inv.status] ?? { label: inv.status, variant: "outline" as const };
                return (
                  <TableRow key={inv.id}>
                    <TableCell>{new Date(inv.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{inv.billing_cycle === "annual" ? "Anual" : "Mensal"}</TableCell>
                    <TableCell className="text-right font-medium">{brl(Number(inv.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "pending" && inv.checkout_url ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={inv.checkout_url} target="_blank" rel="noreferrer">
                            Pagar <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        "—"
                      )}
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
