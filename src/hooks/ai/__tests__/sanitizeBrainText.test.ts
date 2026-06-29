import { describe, it, expect } from "vitest";
import { sanitizeBrainText } from "@/hooks/ai/useAIBrain";

const TOOLS = [
  "create_alert",
  "escalate_alert",
  "notify_user",
  "send_pix_reminder",
  "create_follow_up_task",
  "save_memory",
  "block_client",
  "reschedule_production_order",
  "create_purchase_order",
  "release_order_block",
  "mark_invoice_paid",
  "assign_sales_rep",
  "log_observation",
  "generate_report",
];

describe("sanitizeBrainText — regressão Cérebro Nativo", () => {
  it("remove escalate_alert inline com payload JSON", () => {
    const input =
      'Olá. escalate_alert({"title":"ALERTA CRÍTICO: R$ 821.538,45 em RECEBÍVEIS VENCIDOS.","description":"caixa zerado"}) Tudo certo?';
    const out = sanitizeBrainText(input);
    expect(out).not.toContain("escalate_alert");
    expect(out).not.toContain("ALERTA CRÍTICO");
    expect(out).toContain("Olá.");
    expect(out).toContain("Tudo certo?");
  });

  it("remove blocos ```tool_code``` contendo tool call", () => {
    const input =
      "Vou agir agora.\n```tool_code\nescalate_alert({\"title\":\"x\"})\n```\nFeito.";
    const out = sanitizeBrainText(input);
    expect(out).not.toMatch(/escalate_alert/);
    expect(out).not.toMatch(/tool_code/);
    expect(out).toContain("Feito.");
  });

  it("remove blocos ```json``` contendo tool call", () => {
    const input = 'Resposta:\n```json\n{ "name": "create_alert", "args": {} }\n```\nok';
    const out = sanitizeBrainText(input);
    expect(out).not.toMatch(/create_alert/);
  });

  it("preserva blocos ```json``` sem tool calls", () => {
    const input = 'Resultado:\n```json\n{"saldo": 100}\n```';
    const out = sanitizeBrainText(input);
    expect(out).toContain('"saldo": 100');
  });

  it("remove tags <tool_call>...</tool_call>", () => {
    const input = "antes <tool_call>escalate_alert({})</tool_call> depois";
    const out = sanitizeBrainText(input);
    expect(out).not.toContain("tool_call");
    expect(out).not.toContain("escalate_alert");
    expect(out).toContain("antes");
    expect(out).toContain("depois");
  });

  it.each(TOOLS)("remove chamada inline de %s", (tool) => {
    const input = `prefixo ${tool}({"k":"v","n":1}) sufixo`;
    const out = sanitizeBrainText(input);
    expect(out).not.toContain(tool);
    expect(out).toContain("prefixo");
    expect(out).toContain("sufixo");
  });

  it("remove chamada inline truncada/sem fechar", () => {
    const input = 'texto escalate_alert({"title":"x"';
    const out = sanitizeBrainText(input);
    expect(out).not.toContain("escalate_alert");
  });

  it("não altera texto comum sem tool calls", () => {
    const input = "Tudo certo, sem nada de anormal por aqui.";
    expect(sanitizeBrainText(input)).toBe(input);
  });

  it("colapsa múltiplas quebras de linha após remoção", () => {
    const input = 'a\n\n\n\nescalate_alert({"x":1})\n\n\nb';
    const out = sanitizeBrainText(input);
    expect(out).not.toMatch(/\n{3,}/);
    expect(out).not.toContain("escalate_alert");
  });

  it("lida com string vazia / nula", () => {
    expect(sanitizeBrainText("")).toBe("");
    // @ts-expect-error testando entrada inválida
    expect(sanitizeBrainText(undefined)).toBeFalsy();
  });
});
