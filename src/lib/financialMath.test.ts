import { describe, it, expect } from 'vitest';
import { roundCurrency, calculateInstallments, calculateTotalWithTaxes } from './financialMath';

describe('financialMath', () => {
  describe('roundCurrency', () => {
    it('should round to 2 decimal places correctly', () => {
      expect(roundCurrency(10.555)).toBe(10.56);
      expect(roundCurrency(10.554)).toBe(10.55);
      expect(roundCurrency(1.005)).toBe(1.01);
    });

    it('should handle Number.EPSILON cases', () => {
      expect(roundCurrency(1.005)).toBe(1.01);
    });
  });

  describe('calculateInstallments', () => {
    it('should split value into equal installments and adjust the last one', () => {
      const result = calculateInstallments(100, 3);
      expect(result).toEqual([33.33, 33.33, 33.34]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(100);
    });

    it('should handle zero or negative installments by returning total as one installment', () => {
      expect(calculateInstallments(100, 0)).toEqual([100]);
      expect(calculateInstallments(100, -1)).toEqual([100]);
    });

    it('should work for exact divisions', () => {
      expect(calculateInstallments(100, 2)).toEqual([50, 50]);
    });
  });

  describe('calculateTotalWithTaxes', () => {
    it('should sum base, interest, penalty and subtract discount', () => {
      const total = calculateTotalWithTaxes(100, 10, 5, 20);
      expect(total).toBe(95);
    });

    it('should handle rounding at each step', () => {
      const total = calculateTotalWithTaxes(100.005, 0.005, 0.005, 0);
      // 100.01 + 0.01 + 0.01 = 100.03
      expect(total).toBe(100.03);
    });
  });
});
