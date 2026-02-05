/**
 * Export data to CSV or Excel-compatible format and trigger download.
 */

export interface ExportColumn {
  key: string;
  label: string;
  /** Optional formatter for the value */
  format?: (value: unknown, row: Record<string, unknown>) => string;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';

  const header = columns.map((col) => escapeCSV(col.label)).join(';');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const raw = getNestedValue(row, col.key);
        const value = col.format ? col.format(raw, row) : String(raw ?? '');
        return escapeCSV(value);
      })
      .join(';')
  );

  const csv = BOM + [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  // Simple XML-based Excel export (no library needed)
  const header = columns
    .map((col) => `<th>${escapeXML(col.label)}</th>`)
    .join('');

  const rows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const raw = getNestedValue(row, col.key);
          const value = col.format ? col.format(raw, row) : String(raw ?? '');
          const isNumeric = !isNaN(Number(value)) && value.trim() !== '';
          return isNumeric
            ? `<td style="mso-number-format:'\\@'">${escapeXML(value)}</td>`
            : `<td>${escapeXML(value)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Dados</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #4472C4; color: white; padding: 8px; font-weight: bold; border: 1px solid #ddd; }
        td { padding: 6px 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <table>
        <thead><tr>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  triggerDownload(blob, `${filename}.xls`);
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
