/**
 * FASE 12 — DINHEIRO E PRECISÃO
 * Utilitários centralizados para cálculos financeiros evitando erros de ponto flutuante.
 * O sistema utiliza o padrão de arredondamento de 2 casas decimais para valores monetários.
 */

export const roundCurrency = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const calculateInstallments = (totalAmount: number, installments: number): number[] => {
  if (installments <= 0) return [roundCurrency(totalAmount)];
  
  const installmentAmount = roundCurrency(totalAmount / installments);
  const result: number[] = [];
  
  for (let i = 0; i < installments - 1; i++) {
    result.push(installmentAmount);
  }
  
  // A última parcela ajusta a diferença de arredondamento
  const sumSoFar = result.reduce((acc, val) => acc + val, 0);
  result.push(roundCurrency(totalAmount - sumSoFar));
  
  return result;
};

export const calculateTotalWithTaxes = (baseAmount: number, interest = 0, penalty = 0, discount = 0): number => {
  return roundCurrency(
    roundCurrency(baseAmount) + 
    roundCurrency(interest) + 
    roundCurrency(penalty) - 
    roundCurrency(discount)
  );
};
