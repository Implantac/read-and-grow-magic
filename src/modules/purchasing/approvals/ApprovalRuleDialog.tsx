import { useState } from "react";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/base/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { useUpsertPurchaseApprovalRule } from "@/hooks/purchasing/usePurchaseApprovals";
import { defaultRuleForm, type ApprovalRuleForm } from "./utils";

export function ApprovalRuleDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ApprovalRuleForm>(defaultRuleForm);
  const upsertRule = useUpsertPurchaseApprovalRule();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Nova alçada</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova regra de aprovação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Nível</Label>
            <Input
              type="number"
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: Number(e.target.value) }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor mínimo</Label>
              <Input
                type="number"
                value={form.min_amount}
                onChange={(e) => setForm((f) => ({ ...f, min_amount: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Valor máximo (opcional)</Label>
              <Input
                type="number"
                value={form.max_amount}
                onChange={(e) => setForm((f) => ({ ...f, max_amount: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Papel aprovador</Label>
            <Select
              value={form.approver_role}
              onValueChange={(v) => setForm((f) => ({ ...f, approver_role: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="admin">Diretor / Admin</SelectItem>
                <SelectItem value="system_admin">CEO / System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>SLA (horas)</Label>
            <Input
              type="number"
              min={1}
              value={form.sla_hours}
              onChange={(e) => setForm((f) => ({ ...f, sla_hours: Number(e.target.value) }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={async () => {
              await upsertRule.mutateAsync({
                level: form.level,
                min_amount: form.min_amount,
                max_amount: form.max_amount === "" ? null : Number(form.max_amount),
                approver_role: form.approver_role,
                sla_hours: form.sla_hours,
                active: true,
              });
              setOpen(false);
              setForm(defaultRuleForm);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
