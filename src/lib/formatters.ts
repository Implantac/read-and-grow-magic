/**
 * Formatadores centralizados (pt-BR).
 * Usar estes helpers ao invés de instanciar Intl.NumberFormat/DateTimeFormat repetidamente.
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const brlCompactFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('pt-BR');

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/** Formata valor como moeda BRL: R$ 1.234,56 */
export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return brlFormatter.format(0);
  return brlFormatter.format(n);
}

/** Versão compacta: R$ 1,2 mi */
export function formatBRLCompact(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return brlCompactFormatter.format(0);
  return brlCompactFormatter.format(n);
}

/** Formata número com separadores pt-BR: 1.234,56 */
export function formatNumber(value: number | string | null | undefined, fractionDigits?: number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return '0';
  if (fractionDigits != null) {
    return n.toLocaleString('pt-BR', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
  return numberFormatter.format(n);
}

/** Formata percentual. Aceita ratio (0.15) — multiplique antes se já estiver em escala 0–100. */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio == null || Number.isNaN(ratio)) return '0%';
  return percentFormatter.format(ratio);
}

/** Formata data pt-BR: 28/05/2026 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

/** Formata data + hora pt-BR: 28/05/2026 14:30 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
