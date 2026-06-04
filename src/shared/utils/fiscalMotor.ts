/**
 * MOTOR FISCAL ENTERPRISE
 * Simulação de cálculo de impostos e geração de documentos
 */

export interface TaxCalculationResult {
  icms_base: number;
  icms_value: number;
  icms_st_value: number;
  ipi_value: number;
  pis_value: number;
  cofins_value: number;
  total_taxes: number;
}

export const calculateTaxes = (
  item: { price: number; quantity: number; ncm?: string }, 
  origin: string, 
  destination: string, 
  rules: any[],
  taxRegime: string = 'simples_nacional'
): TaxCalculationResult => {
  const baseAmount = item.price * item.quantity;
  
  // Busca regra específica por NCM e Estado, ou regra geral por Estado
  const rule = rules.find(r => 
    r.origin_state === origin && 
    r.destination_state === destination &&
    (r.ncm === item.ncm || !r.ncm)
  ) || rules.find(r => r.origin_state === origin && r.destination_state === destination);

  // Lógica simplificada de alíquotas baseada no regime se não houver regra
  const icmsRate = rule?.icms_rate ?? (origin === destination ? 18 : 12);
  const ipiRate = rule?.ipi_rate ?? 0;
  const pisRate = rule?.pis_rate ?? (taxRegime === 'lucro_real' ? 1.65 : 0.65);
  const cofinsRate = rule?.cofins_rate ?? (taxRegime === 'lucro_real' ? 7.6 : 3);

  const icms_value = baseAmount * (icmsRate / 100);
  const ipi_value = baseAmount * (ipiRate / 100);
  const pis_value = baseAmount * (pisRate / 100);
  const cofins_value = baseAmount * (cofinsRate / 100);
  const icms_st_value = rule?.icms_st_rate ? (baseAmount * (rule.icms_st_rate / 100)) : 0;

  return {
    icms_base: baseAmount,
    icms_value,
    icms_st_value,
    ipi_value,
    pis_value,
    cofins_value,
    total_taxes: icms_value + ipi_value + pis_value + cofins_value + icms_st_value
  };
};

export const generateNFeXML = (header: any, items: any[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?><infNFe chNFe="${Math.random().toString().slice(2, 46)}" versao="4.00">...</infNFe>`;
};

