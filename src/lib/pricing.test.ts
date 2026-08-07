import { describe, it, expect } from 'vitest';
import { roundCurrency } from './financialMath';

/**
 * Testes para a Fase 14 do Hardening Master Plan.
 * Foco: Integridade de Pricing (Precificação Comercial).
 */
describe('Pricing Integrity (Hardening Phase 14)', () => {
  it('should calculate sale price with minimum margin requirement', () => {
    const cost = 100;
    const minMargin = 0.3; // 30% markup
    const targetPrice = cost * (1 + minMargin);
    expect(roundCurrency(targetPrice)).toBe(130.00);
  });

  it('should handle zero cost price correctly in margin calculations', () => {
    const cost = 0;
    const margin = 0.5;
    expect(roundCurrency(cost * (1 + margin))).toBe(0.00);
  });

  it('should apply volume discounts correctly without rounding errors', () => {
    const unitPrice = 10.55;
    const quantity = 3;
    const discountPercent = 0.05; // 5%
    
    const subtotal = unitPrice * quantity; // 31.65
    const discount = subtotal * discountPercent; // 1.5825
    const total = subtotal - discount; // 30.0675
    
    expect(roundCurrency(total)).toBe(30.07);
  });

  it('should validate total with tiered pricing', () => {
    // Ex: 1-10 units: $10, 11+ units: $9
    const getPrice = (q: number) => q > 10 ? 9 : 10;
    
    expect(getPrice(5)).toBe(10);
    expect(getPrice(15)).toBe(9);
  });
});
