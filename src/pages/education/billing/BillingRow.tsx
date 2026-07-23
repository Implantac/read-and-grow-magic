import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { TableCell, TableRow } from "@/ui/base/table";
import { toastSuccess, toastError } from "@/lib/toastHelpers";
import type { Receivable } from "./types";
import { formatCurrencyPtBr, isPaidReceivable } from "./helpers";

interface Props {
  receivable: Receivable;
  today: Date;
  markPaid: { mutateAsync: (r: Receivable) => Promise<unknown>; isPending: boolean };
}

export function BillingRow({ receivable: r, today, markPaid }: Props) {
  const due = new Date(r.due_date);
  const open = Number(r.open_amount ?? r.amount ?? 0);
  const isPaid = isPaidReceivable(r);
  const isOverdue = !isPaid && due < today;

  const handleCopy = async () => {
    const msg = `Olá ${r.client_name ?? ""}, sua mensalidade${
      r.description ? ` (${r.description})` : ""
    } no valor de ${formatCurrencyPtBr(
      open || Number(r.amount),
    )} ${isOverdue ? "venceu em" : "vence em"} ${due.toLocaleDateString("pt-BR")}. Qualquer dúvida, estamos à disposição.`;
    try {
      await navigator.clipboard.writeText(msg);
      toastSuccess("Mensagem copiada.");
    } catch {
      toastError("Não foi possível copiar.");
    }
  };

  const handleMarkPaid = async () => {
    try {
      await markPaid.mutateAsync(r);
      toastSuccess("Mensalidade marcada como paga.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao marcar como paga.";
      toastError(msg);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{r.client_name}</TableCell>
      <TableCell className="text-xs">{due.toLocaleDateString("pt-BR")}</TableCell>
      <TableCell className="text-right">{formatCurrencyPtBr(Number(r.amount))}</TableCell>
      <TableCell className="text-right">
        <Badge variant={isPaid ? "default" : isOverdue ? "destructive" : "secondary"}>
          {isPaid ? "Paga" : isOverdue ? "Vencida" : "Em aberto"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {!isPaid && (
            <Button size="sm" variant="ghost" title="Copiar mensagem de cobrança" onClick={handleCopy}>
              Copiar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={isPaid || markPaid.isPending}
            onClick={handleMarkPaid}
          >
            {isPaid ? "Paga" : "Marcar paga"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
