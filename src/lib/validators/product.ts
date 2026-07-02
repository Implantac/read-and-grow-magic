// Validadores do Catálogo Universal de Produtos (Fase 2)

export type ItemKind = 'acabado' | 'materia_prima' | 'servico' | 'kit' | 'insumo' | 'revenda';

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  acabado: 'Produto Acabado',
  materia_prima: 'Matéria-Prima',
  servico: 'Serviço',
  kit: 'Kit / Combo',
  insumo: 'Insumo',
  revenda: 'Revenda',
};

// Kinds permitidos por natureza do produto
export function allowedKindsFor(nature: 'industry' | 'commerce' | 'service'): ItemKind[] {
  if (nature === 'service') return ['servico'];
  if (nature === 'industry') return ['acabado', 'materia_prima', 'kit', 'insumo'];
  return ['revenda', 'kit'];
}

// NCM: exatamente 8 dígitos numéricos
export function isValidNcm(ncm: string | null | undefined): boolean {
  if (!ncm) return true; // opcional
  return /^[0-9]{8}$/.test(ncm.replace(/\D/g, ''));
}

export function normalizeNcm(ncm: string): string {
  return ncm.replace(/\D/g, '').slice(0, 8);
}

// GTIN/EAN-13/14/12/8 — valida dígito verificador (algoritmo GS1)
export function isValidGtin(gtin: string | null | undefined): boolean {
  if (!gtin) return true; // opcional
  const digits = gtin.replace(/\D/g, '');
  if (![8, 12, 13, 14].includes(digits.length)) return false;
  const nums = digits.split('').map(Number);
  const check = nums.pop()!;
  const reversed = nums.reverse();
  const sum = reversed.reduce((acc, n, i) => acc + n * (i % 2 === 0 ? 3 : 1), 0);
  const calc = (10 - (sum % 10)) % 10;
  return calc === check;
}
