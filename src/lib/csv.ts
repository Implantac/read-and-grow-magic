type Row = Record<string, string | number | null | undefined>;

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: Row[], headers: { key: string; label: string }[]): string {
  const head = headers.map((h) => escapeCsv(h.label)).join(';');
  const body = rows
    .map((r) => headers.map((h) => escapeCsv(r[h.key])).join(';'))
    .join('\n');
  // BOM para Excel reconhecer UTF-8
  return '\ufeff' + head + '\n' + body + '\n';
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
