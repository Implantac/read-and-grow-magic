import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks ---
vi.mock('@/core/auth/EnterpriseContext', () => ({
  useEnterprise: () => ({ executiveCouncil: { mission: 'Missão teste' } }),
}));

const sendMock = vi.fn();
const clearMock = vi.fn();
vi.mock('@/hooks/ai/useAIBrain', () => ({
  useBrainRuns: () => ({ data: [] }),
  useBrainLearning: () => ({ data: { approvalRate: 0.9 } }),
  useBrainChat: () => ({ messages: [], loading: false, send: sendMock, clear: clearMock }),
}));

vi.mock('@/components/executive/ExecutiveIntelligenceStatus', () => ({
  ExecutiveIntelligenceStatus: () => <div data-testid="intel-status" />,
}));

// ResizeObserver shim for Radix
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO;
// scrollTo shim for ScrollArea/ref
Element.prototype.scrollTo = Element.prototype.scrollTo || (() => {});
// hasPointerCapture / scrollIntoView for Radix Dialog
Element.prototype.hasPointerCapture = Element.prototype.hasPointerCapture || (() => false);
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});

import { ExecutiveCouncilPanel } from '../ExecutiveCouncilPanel';

const SPECIALISTS = [
  'Global CTO', 'SAP S/4HANA', 'Oracle NetSuite', 'TOTVS/Sankhya',
  'Industrial/PCP', 'WMS/TMS', 'Fiscal/Contábil', 'Supply Chain',
  'HR Strategy', 'Market Intel', 'IA Specialist',
];

const renderPanel = () =>
  render(
    <MemoryRouter>
      <ExecutiveCouncilPanel />
    </MemoryRouter>
  );

describe('ExecutiveCouncilPanel', () => {
  beforeEach(() => {
    sendMock.mockClear();
    clearMock.mockClear();
  });

  it('renderiza um botão clicável para cada um dos 11 especialistas', () => {
    renderPanel();
    for (const role of SPECIALISTS) {
      const btn = screen.getByRole('button', { name: `Consultar especialista ${role}` });
      expect(btn).toBeInTheDocument();
      expect(btn).not.toBeDisabled();
    }
  });

  it.each(SPECIALISTS)('abre o diálogo com a persona correta ao clicar em %s', (role) => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: `Consultar especialista ${role}` }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(`Especialista: ${role}`)).toBeInTheDocument();
    // input focado para a persona
    expect(within(dialog).getByLabelText(`Mensagem para ${role}`)).toBeInTheDocument();
  });

  it('exibe as sugestões rápidas da persona e envia ao clicar', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar especialista Industrial/PCP' }));
    const dialog = screen.getByRole('dialog');
    const suggestion = within(dialog).getByRole('button', { name: 'Analisar OEE atual' });
    expect(suggestion).toBeInTheDocument();
    fireEvent.click(suggestion);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const [prompt, agent] = sendMock.mock.calls[0];
    expect(agent).toBe('Industrial/PCP');
    expect(prompt).toContain('Persona: Industrial/PCP');
    expect(prompt).toContain('Analisar OEE atual');
  });

  it('envia mensagem digitada pelo formulário com a persona correta', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Consultar especialista Fiscal/Contábil' }));
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByLabelText('Mensagem para Fiscal/Contábil') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Como está o SPED?' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar' }));
    expect(sendMock).toHaveBeenCalledWith(
      expect.stringContaining('Como está o SPED?'),
      'Fiscal/Contábil',
    );
  });
});
