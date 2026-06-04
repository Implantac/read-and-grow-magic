/**
 * MOTOR FISCAL ENTERPRISE
 * Simulação de cálculo de impostos e geração de documentos
 */

export const calculateTaxes = (
  items: any[], 
  origin: string, 
  destination: string, 
  rules: any[]
) => {
  return items.map(item => {
    const rule = rules.find(r => 
      r.origin_state === origin && 
      r.destination_state === destination &&
      (r.ncm === item.ncm || !r.ncm)
    );

    const baseAmount = item.price * item.quantity;
    const icms = baseAmount * ((rule?.icms_rate || 0) / 100);
    const ipi = baseAmount * ((rule?.ipi_rate || 0) / 100);
    
    return {
      ...item,
      tax_details: {
        icms,
        ipi,
        total_taxes: icms + ipi
      }
    };
  });
};

export const generateNFeXML = (header: any, items: any[]) => {
  // Simulação de geração de XML para NF-e
  return `<?xml version="1.0" encoding="UTF-8"?><infNFe chNFe="${Math.random().toString().slice(2, 46)}" versao="4.00">...</infNFe>`;
};
