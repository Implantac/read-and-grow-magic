import { describe, it, expect } from 'vitest';
import { canTransition, nextStatuses } from '../transferWorkflow';

describe('Regras do ciclo de transferência', () => {
  it('bloqueia salto de etapa', () => {
    expect(canTransition('SUGERIDA', 'EXPEDIDA')).toBe(false);
    expect(canTransition('APROVADA', 'EM TRÂNSITO')).toBe(false);
  });

  it('bloqueia repetição do mesmo estado', () => {
    expect(canTransition('EXPEDIDA', 'EXPEDIDA')).toBe(false);
  });

  it('permite a sequência operacional completa', () => {
    const fluxo = ['SUGERIDA', 'APROVADA', 'RESERVADA', 'SEPARAÇÃO', 'CONFERÊNCIA', 'EXPEDIDA', 'EM TRÂNSITO', 'RECEBIDA', 'CONFERIDA', 'ENCERRADA'] as const;
    for (let i = 0; i < fluxo.length - 1; i++) {
      expect(canTransition(fluxo[i], fluxo[i + 1])).toBe(true);
    }
  });

  it('permite recebimento parcial e com divergência a partir do trânsito', () => {
    expect(canTransition('EM TRÂNSITO', 'RECEBIDA PARCIAL')).toBe(true);
    expect(canTransition('EM TRÂNSITO', 'RECEBIDA COM DIVERGÊNCIA')).toBe(true);
  });

  it('permite rejeitar apenas na solicitação e cancelar antes da expedição', () => {
    expect(canTransition('SUGERIDA', 'REJEITADA')).toBe(true);
    expect(canTransition('CONFERÊNCIA', 'CANCELADA')).toBe(true);
    expect(canTransition('EM TRÂNSITO', 'CANCELADA')).toBe(false);
  });

  it('não deixa sair de estados finais', () => {
    expect(nextStatuses('ENCERRADA')).toHaveLength(0);
    expect(nextStatuses('CANCELADA')).toHaveLength(0);
    expect(nextStatuses('REJEITADA')).toHaveLength(0);
  });
});
