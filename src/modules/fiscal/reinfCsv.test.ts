import { describe, it, expect } from 'vitest';
import type { ReinfEvent, ReinfPeriod } from '@/hooks/fiscal/useReinf';
import {
  buildR2099Rows, buildR4099Rows,
  validateR2099Rows, validateR4099Rows,
  validateTotalsRow, parseBRL, fmt,
  REINF_TOLERANCE,
} from './reinfCsv';

const period2099: ReinfPeriod = {
  id: 'p1', company_id: 'c1', competencia: '2026-05-01',
  status: 'fechado', closed_at: '2026-06-07T12:00:00Z',
  totals: { r2010_qtd: 3, r2010_inss: 1100 }, // base = 10000
};

const period4099: ReinfPeriod = {
  id: 'p2', company_id: 'c1', competencia: '2026-05-01',
  status: 'fechado', closed_at: '2026-06-07T12:00:00Z',
  totals: {
    r4020_qtd: 2,
    r4020_ir: 150, r4020_csll: 100, r4020_pis: 65, r4020_cofins: 300,
  },
};

const ev = (type: 'R-2099' | 'R-4099'): ReinfEvent => ({
  id: `e-${type}`, period_id: 'p1', event_type: type, status: 'gerado',
  cnpj_prestador: null, cnpj_beneficiario: null, nota_fiscal: null,
  data_emissao: null, vr_bruto: 0, vr_ret_inss: null, vr_ret_ir: null,
  vr_ret_csll: null, vr_ret_pis: null, vr_ret_cofins: null,
  cod_serv: null, cod_receita: null,
});

describe('parseBRL / fmt', () => {
  it('round-trips BRL formatting', () => {
    expect(parseBRL(fmt(1234.56))).toBeCloseTo(1234.56, 2);
    expect(parseBRL('0,00')).toBe(0);
    expect(parseBRL('')).toBe(0);
  });
});

describe('R-2099 CSV', () => {
  it('TOTAL row matches currentPeriod.totals', () => {
    const rows = buildR2099Rows([ev('R-2099')], period2099);
    const result = validateR2099Rows(rows, period2099);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    const total = rows.find((r) => r.event_type === 'TOTAL')!;
    expect(parseBRL(total.vr_ret_inss)).toBeCloseTo(1100, 2);
    expect(parseBRL(total.vr_base_inss)).toBeCloseTo(10000, 2);
  });

  it('detects divergence beyond tolerance', () => {
    const rows = buildR2099Rows([ev('R-2099')], period2099);
    const tampered = rows.map((r) =>
      r.event_type === 'TOTAL' ? { ...r, vr_ret_inss: fmt(1100.5) } : r,
    );
    const result = validateR2099Rows(tampered, period2099);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('vr_ret_inss');
  });

  it('accepts drift within R$ 0,01 tolerance', () => {
    const rows = buildR2099Rows([ev('R-2099')], period2099);
    const drift = rows.map((r) =>
      r.event_type === 'TOTAL' ? { ...r, vr_ret_inss: fmt(1100 + REINF_TOLERANCE) } : r,
    );
    expect(validateR2099Rows(drift, period2099).ok).toBe(true);
  });

  it('fails when TOTAL row is missing', () => {
    const noTotal = buildR2099Rows([ev('R-2099')], period2099).filter((r) => r.event_type !== 'TOTAL');
    const result = validateR2099Rows(noTotal, period2099);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/TOTAL/);
  });
});

describe('R-4099 CSV', () => {
  it('TOTAL row and DARF match currentPeriod.totals', () => {
    const rows = buildR4099Rows([ev('R-4099')], period4099);
    const result = validateR4099Rows(rows, period4099);
    expect(result.ok).toBe(true);
    const total = rows.find((r) => r.event_type === 'TOTAL')!;
    expect(parseBRL(total.vr_total_darf)).toBeCloseTo(150 + 100 + 65 + 300, 2);
    expect(parseBRL(total.vr_ret_ir)).toBeCloseTo(150, 2);
    expect(parseBRL(total.vr_ret_csll)).toBeCloseTo(100, 2);
    expect(parseBRL(total.vr_ret_pis)).toBeCloseTo(65, 2);
    expect(parseBRL(total.vr_ret_cofins)).toBeCloseTo(300, 2);
  });

  it('detects DARF divergence beyond tolerance', () => {
    const rows = buildR4099Rows([ev('R-4099')], period4099);
    const tampered = rows.map((r) =>
      r.event_type === 'TOTAL' ? { ...r, vr_total_darf: fmt(999) } : r,
    );
    const result = validateR4099Rows(tampered, period4099);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toContain('vr_total_darf');
  });

  it('detects individual component divergence (CSLL)', () => {
    const rows = buildR4099Rows([ev('R-4099')], period4099);
    const tampered = rows.map((r) =>
      r.event_type === 'TOTAL' ? { ...r, vr_ret_csll: fmt(200) } : r,
    );
    const result = validateR4099Rows(tampered, period4099);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('vr_ret_csll'))).toBe(true);
  });

  it('accepts drift within R$ 0,01 tolerance on DARF', () => {
    const rows = buildR4099Rows([ev('R-4099')], period4099);
    const darf = 150 + 100 + 65 + 300;
    const drift = rows.map((r) =>
      r.event_type === 'TOTAL' ? { ...r, vr_total_darf: fmt(darf + REINF_TOLERANCE) } : r,
    );
    expect(validateR4099Rows(drift, period4099).ok).toBe(true);
  });
});

describe('validateTotalsRow custom tolerance', () => {
  it('rejects when diff exceeds custom tolerance', () => {
    const rows = [{ event_type: 'TOTAL', v: '10,05' }];
    expect(validateTotalsRow(rows, { v: 10 }, 0.01).ok).toBe(false);
    expect(validateTotalsRow(rows, { v: 10 }, 0.1).ok).toBe(true);
  });
});
