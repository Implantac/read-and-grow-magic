import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, render, screen } from "@testing-library/react";
import React from "react";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

import { useBrainChat } from "@/hooks/ai/useAIBrain";

const TOOL_PAYLOADS = [
  'save_memory ({"key":"x","value":"y"})',
  'escalate_alert({"title":"ALERTA CRÍTICO"})',
  '```tool_code\ncreate_alert({"a":1})\n```',
  '<tool_call>notify_user({"id":"u1"})</tool_call>',
  'texto antes save_memory  ({"k":"v"}) texto depois',
];

const FORBIDDEN = [
  "save_memory", "escalate_alert", "create_alert", "notify_user",
  "tool_code", "tool_call", "ALERTA CRÍTICO",
];

function ChatHarness() {
  const { messages, send } = useBrainChat();
  React.useEffect(() => { void send("oi"); }, [send]);
  return (
    <ul>
      {messages.filter((m) => m.role === "assistant").map((m) => (
        <li key={m.id} data-testid="assistant-msg">{m.content}</li>
      ))}
    </ul>
  );
}

describe("Cérebro Nativo — integração: tool calls nunca renderizadas", () => {
  beforeEach(() => invokeMock.mockReset());

  it.each(TOOL_PAYLOADS)("sanitiza payload do backend: %s", async (raw) => {
    invokeMock.mockResolvedValue({
      data: { content: `Resposta normal. ${raw} Continuação.`, actions: [] },
      error: null,
    });
    const { result } = renderHook(() => useBrainChat());
    await act(async () => { await result.current.send("teste"); });
    const assistant = result.current.messages.find((m) => m.role === "assistant");
    expect(assistant).toBeDefined();
    for (const term of FORBIDDEN) expect(assistant!.content).not.toContain(term);
    expect(assistant!.content).toMatch(/Resposta normal|Continuação|texto/);
  });

  it("não renderiza nomes de ferramentas no DOM", async () => {
    invokeMock.mockResolvedValue({
      data: {
        content: 'Ok. save_memory ({"k":"v"}) e escalate_alert({"t":"x"}) feito.',
        actions: [],
      },
      error: null,
    });
    render(<ChatHarness />);
    const node = await screen.findByTestId("assistant-msg");
    for (const term of FORBIDDEN) expect(node.textContent ?? "").not.toContain(term);
  });
});
