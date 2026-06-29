// Simple CSV parser supporting quoted fields, commas, and CRLF line endings.
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',' || c === ';') { cur.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field.length || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== '')).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
    return obj;
  });
}

export const STOP_CSV_TEMPLATE = [
  'customer_name,address,city,state,zip_code,latitude,longitude,weight_kg,notes,time_window_start,time_window_end',
  'Cliente Exemplo,Rua A 123,São Paulo,SP,01000-000,,,150,Entrega pela manhã,08:00,12:00',
].join('\n');
