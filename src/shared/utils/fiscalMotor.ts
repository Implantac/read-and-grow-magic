/**
 * MOTOR FISCAL ENTERPRISE - REFORMA TRIBUTÁRIA READY
 * Suporte a regime Híbrido: ICMS/IPI/PIS/COFINS + IBS/CBS
 */

export interface TaxCalculationResult {
  icms_base: number;
  icms_value: number;
  icms_st_value: number;
  ipi_value: number;
  pis_value: number;
  cofins_value: number;
  cbs_value: number;
  ibs_value: number;
  total_taxes: number;
}

export const calculateTaxes = (
  item: { price: number; quantity: number; ncm?: string }, 
  origin: string, 
  destination: string, 
  rules: any[],
  taxRegime: string = 'simples_nacional',
  regimeType: 'current' | 'hybrid' | 'reformed' = 'hybrid'
): TaxCalculationResult => {
  const baseAmount = item.price * item.quantity;
  
  const rule = rules.find(r => 
    r.origin_state === origin && 
    r.destination_state === destination &&
    (r.ncm === item.ncm || !r.ncm)
  ) || rules.find(r => r.origin_state === origin && r.destination_state === destination);

  // 1. Regras Atuais (Com redução gradual se for híbrido)
  const reductionFactor = regimeType === 'hybrid' ? 0.9 : (regimeType === 'reformed' ? 0 : 1);
  
  const icmsRate = (rule?.icms_rate ?? (origin === destination ? 18 : 12)) * reductionFactor;
  const ipiRate = (rule?.ipi_rate ?? 0) * reductionFactor;
  const pisRate = (rule?.pis_rate ?? (taxRegime === 'lucro_real' ? 1.65 : 0.65)) * reductionFactor;
  const cofinsRate = (rule?.cofins_rate ?? (taxRegime === 'lucro_real' ? 7.6 : 3)) * reductionFactor;

  // 2. Novas Regras (Reforma Tributária - IBS/CBS)
  // Alíquotas de teste padrão se não houver na regra
  const cbsRate = rule?.cbs_rate ?? (regimeType !== 'current' ? 8.8 : 0);
  const ibsRate = rule?.ibs_rate ?? (regimeType !== 'current' ? 17.7 : 0);

  const icms_value = baseAmount * (icmsRate / 100);
  const ipi_value = baseAmount * (ipiRate / 100);
  const pis_value = baseAmount * (pisRate / 100);
  const cofins_value = baseAmount * (cofinsRate / 100);
  const icms_st_value = rule?.icms_st_rate ? (baseAmount * (rule.icms_st_rate / 100)) * reductionFactor : 0;
  
  const cbs_value = baseAmount * (cbsRate / 100);
  const ibs_value = baseAmount * (ibsRate / 100);

  return {
    icms_base: baseAmount,
    icms_value,
    icms_st_value,
    ipi_value,
    pis_value,
    cofins_value,
    cbs_value,
    ibs_value,
    total_taxes: icms_value + ipi_value + pis_value + cofins_value + icms_st_value + cbs_value + ibs_value
  };
};

export const generateNFeXML = (header: any, items: any[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?><infNFe chNFe="${Math.random().toString().slice(2, 46)}" versao="4.00">...</infNFe>`;
};


