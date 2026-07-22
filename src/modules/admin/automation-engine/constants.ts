import type { AutomationAction, AutomationCondition } from "@/hooks/useAutomationEngine";

export const TRIGGER_EVENTS = [
  { value: "order.created", label: "Pedido criado" },
  { value: "order.status_changed", label: "Pedido — status alterado" },
  { value: "order.updated", label: "Pedido atualizado" },
  { value: "accounts_payable.created", label: "Conta a pagar criada" },
  { value: "accounts_payable.status_changed", label: "Conta a pagar — status alterado" },
  { value: "accounts_receivable.created", label: "Conta a receber criada" },
  { value: "accounts_receivable.status_changed", label: "Conta a receber — status alterado" },
  { value: "production_order.created", label: "Ordem de produção criada" },
  { value: "production_order.status_changed", label: "OP — status alterado" },
  { value: "nfe.created", label: "NF-e criada" },
  { value: "nfe.status_changed", label: "NF-e — status alterado" },
];

export const ACTION_TYPES = [
  { value: "notification", label: "Notificação interna" },
  { value: "webhook", label: "Webhook HTTP" },
  { value: "log", label: "Registrar em log" },
  { value: "start_workflow", label: "Iniciar workflow" },
];

export const OPERATORS = [
  { value: "eq", label: "= igual" },
  { value: "neq", label: "≠ diferente" },
  { value: "gt", label: "> maior" },
  { value: "lt", label: "< menor" },
  { value: "contains", label: "contém" },
];

export type FormState = {
  id?: string;
  name: string;
  description: string;
  trigger_event: string;
  is_active: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

export const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  trigger_event: "",
  is_active: true,
  conditions: [],
  actions: [{ type: "notification", config: { title: "", message: "" } }],
};
