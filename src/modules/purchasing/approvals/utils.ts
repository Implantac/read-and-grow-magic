export type SLATone = "success" | "warning" | "destructive" | "muted";

export function slaStatus(dueAt: string | null | undefined): { label: string; tone: SLATone } {
  if (!dueAt) return { label: "Sem SLA", tone: "muted" };
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  if (now >= due) return { label: "Vencida", tone: "destructive" };
  if (due - now <= 4 * 3600 * 1000) return { label: "Em risco", tone: "warning" };
  const hours = Math.floor((due - now) / 3600000);
  return { label: `Vence em ${hours}h`, tone: "success" };
}

export const formatBRL = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type ApprovalRuleForm = {
  level: number;
  min_amount: number;
  max_amount: string;
  approver_role: string;
  sla_hours: number;
  active: boolean;
};

export const defaultRuleForm: ApprovalRuleForm = {
  level: 1,
  min_amount: 0,
  max_amount: "",
  approver_role: "manager",
  sla_hours: 24,
  active: true,
};
