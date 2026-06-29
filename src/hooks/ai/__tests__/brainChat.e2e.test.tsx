import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import ReactMarkdown from "react-markdown";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

import { useBrainChat } from "@/hooks/ai/useAIBrain";

const FORBIDDEN = [
  "save_memory", "escalate_alert", "create_alert", "notify_user",
  "send_pix_reminder", "create_follow_up_task", "block_client",
  "reschedule_production_order", "create_purchase_order",
  "release_order_block", "mark_invoice_paid", "assign_sales_rep",
  "log_observation", "generate_report",
  "tool_code", "tool_call", "ALERTA CRÍTICO",
];

// Replicates the relevant chunk of src/pages/executive/Brain.tsx (chat panel)
function ChatPanel() {
  const { messages, loading, send } = useBrainChat();
  const [input, setInput] = React.useState("");
  const handleSend = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    void send(t);
  };
  return (
    <div>
      <ul data-testid="messages">
        {messages.map((m) => (
          <li key={m.id} data-role={m.role} data-testid={`msg-${m.role}`}>
            {m.role === "assistant" ? (
              <div className="prose">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </li>
        ))}
      </ul>
      <textarea
        aria-label="chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={handleSend} aria-label="send">enviar</button>
    </div>
  );
}

const SCENARIOS: Array<{ name: string; reply: string }> = [
  {
    name: "inline tool call sem espaço",
    reply: 'Ok. escalate_alert({"title":"ALERTA CRÍTICO: R$ 1.000,00"}) Pronto.',
  },
  {
    name: "inline tool call COM espaço antes do parêntese",
    reply: 'Beleza. save_memory ({"key":"a","value":"b"}) feito.',
  },
  {
    name: "inline tool call com múltiplos espaços",
    reply: 'Vamos lá. notify_user  ({"id":"u1"}) ok.',
  },
  {
    name: "bloco ```tool_code```",
    reply: "Veja:\n```tool_code\nescalate_alert({\"x\":1})\n```\nFim.",
  },
  {
    name: "bloco ```json``` com tool",
    reply: "Resposta:\n```json\n{\"name\":\"create_alert\",\"args\":{}}\n```\nok",
  },
  {
    name: "tag <tool_call>",
    reply: "antes <tool_call>notify_user({})</tool_call> depois",
  },
  {
    name: "múltiplas chamadas misturadas com markdown",
    reply:
      "## Diagnóstico\n- save_memory ({\"k\":\"v\"})\n- **risco** escalate_alert({\"t\":\"x\"})\n\nResumo final.",
  },
  {
    name: "tool call truncado",
    reply: 'parcial save_memory ({"key":"x"',
  },
];

describe("Cérebro Nativo — E2E: fluxo completo do chat sem vazamento de tool calls", () => {
  beforeEach(() => invokeMock.mockReset());

  it.each(SCENARIOS)("cenário: $name", async ({ reply }) => {
    invokeMock.mockResolvedValue({
      data: { content: `Início. ${reply} Fim.`, actions: [] },
      error: null,
    });

    render(<ChatPanel />);

    const textarea = screen.getByLabelText("chat-input") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Pergunta de teste" } });
    await act(async () => {
      fireEvent.click(screen.getByLabelText("send"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("msg-assistant")).not.toBeNull();
    });

    const list = screen.getByTestId("messages");
    const dom = list.textContent ?? "";
    for (const term of FORBIDDEN) {
      expect(dom, `DOM não deve conter "${term}" — cenário: ${reply}`).not.toContain(term);
    }
    // Sanidade: contexto natural permanece
    expect(dom).toMatch(/Início|Fim|Diagnóstico|Resumo|antes|depois|Pronto|feito|ok|parcial/i);
  });

  it("fluxo multi-turno: várias mensagens consecutivas continuam sanitizadas", async () => {
    const replies = [
      'r1 save_memory ({"k":1})',
      'r2 escalate_alert({"t":"x"}) ok',
      'r3\n```tool_code\ncreate_alert({})\n```\nfim',
    ];
    let i = 0;
    invokeMock.mockImplementation(() =>
      Promise.resolve({ data: { content: replies[i++], actions: [] }, error: null }),
    );

    render(<ChatPanel />);
    const textarea = screen.getByLabelText("chat-input") as HTMLTextAreaElement;
    const send = screen.getByLabelText("send");

    for (let turn = 0; turn < replies.length; turn++) {
      fireEvent.change(textarea, { target: { value: `pergunta ${turn}` } });
      await act(async () => { fireEvent.click(send); });
      await waitFor(() => {
        expect(screen.getAllByTestId("msg-assistant").length).toBe(turn + 1);
      });
    }

    const dom = screen.getByTestId("messages").textContent ?? "";
    for (const term of FORBIDDEN) expect(dom).not.toContain(term);
  });
});
