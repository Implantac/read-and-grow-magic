export const fmtBRL = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const PERIODS: Record<string, { label: string; days: number | null }> = {
  '7': { label: 'Últimos 7 dias', days: 7 },
  '30': { label: 'Últimos 30 dias', days: 30 },
  '90': { label: 'Últimos 90 dias', days: 90 },
  'all': { label: 'Todo o histórico', days: null },
};

export function exportCSV(rows: Array<Record<string, string | number>>, filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => escape(r[h])).join(';'))].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
