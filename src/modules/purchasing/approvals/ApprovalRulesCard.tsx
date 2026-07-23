import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import { Trash2, ShieldCheck, Timer } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  useDeletePurchaseApprovalRule,
  usePurchaseApprovalRules,
} from "@/hooks/purchasing/usePurchaseApprovals";
import { ApprovalRuleDialog } from "./ApprovalRuleDialog";
import { formatBRL } from "./utils";

export function ApprovalRulesCard() {
  const rules = usePurchaseApprovalRules();
  const deleteRule = useDeletePurchaseApprovalRule();

  const sortedRules = useMemo(
    () => (rules.data ?? []).slice().sort((a, b) => a.level - b.level),
    [rules.data]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alçadas por valor</CardTitle>
        <ApprovalRuleDialog />
      </CardHeader>
      <CardContent>
        {sortedRules.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Sem alçadas configuradas"
            description="Defina faixas de valor e responsáveis para automatizar aprovações de pedidos de compra."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nível</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>L{r.level}</TableCell>
                  <TableCell>
                    {formatBRL(r.min_amount)} — {r.max_amount ? formatBRL(r.max_amount) : "∞"}
                  </TableCell>
                  <TableCell>{r.approver_role}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Timer className="h-3 w-3" /> {r.sla_hours}h
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.active ? "default" : "outline"}>
                      {r.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRule.mutate(r.id)}
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
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
