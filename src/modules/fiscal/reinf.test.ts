import { describe, it, expect } from 'vitest';
import { fmt, parseBRL, validateTotalsRow } from './reinfCsv';

describe('REINF reinfCsv', () => {
  describe('fmt', () => {
    it('should format numbers with comma as decimal separator', () => {
      expect(fmt(1234.56)).toBe('1234,56');
      expect(fmt(10)).toBe('10,00');
      expect(fmt(0)).toBe('0,00');
    });
  });

  describe('parseBRL', () => {
    it('should parse BRL formatted strings back to numbers', () => {
      expect(parseBRL('1.234,56')).toBe(1234.56);
      expect(parseBRL('10,00')).toBe(10);
      expect(parseBRL('0,00')).toBe(0);
      expect(parseBRL('')).toBe(0);
      expect(parseBRL(null as any)).toBe(0);
    });
  });

  describe('validateTotalsRow', () => {
    it('should validate row totals within tolerance', () => {
      const rows = [
        { event_type: 'R-2010', vr_ret_inss: '100,00' },
        { event_type: 'TOTAL', vr_ret_inss: '100,00' }
      ];
      const expected = { vr_ret_inss: 100 };
      const result = validateTotalsRow(rows, expected);
      expect(result.ok).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when difference exceeds tolerance', () => {
      const rows = [
        { event_type: 'TOTAL', vr_ret_inss: '100,00' }
      ];
      const expected = { vr_ret_inss: 100.05 }; // Diff 0.05 > 0.01 tolerance
      const result = validateTotalsRow(rows, expected);
      expect(result.ok).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('vr_ret_inss');
    });

    it('should return error if TOTAL row is missing', () => {
      const rows = [{ event_type: 'R-2010', vr_ret_inss: '100,00' }];
      const result = validateTotalsRow(rows, { vr_ret_inss: 100 });
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toBe('Linha TOTAL ausente no CSV.');
    });
  });
});
