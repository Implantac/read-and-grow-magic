import type { ReinfEvent, ReinfPeriod } from '@/hooks/fiscal/useReinf';

export const REINF_TOLERANCE = 0.01;

export const R2099_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'competencia', label: 'Competência' },
  { key: 'status', label: 'Status' },
  { key: 'qtd_r2010', label: 'Qtd Eventos R-2010' },
  { key: 'vr_base_inss', label: 'Base INSS' },
  { key: 'vr_ret_inss', label: 'INSS Retido (DARF)' },
  { key: 'data_fechamento', label: 'Data Fechamento' },
];

export const R4099_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'competencia', label: 'Competência' },
  { key: 'status', label: 'Status' },
  { key: 'qtd_r4020', label: 'Qtd Eventos R-4020' },
  { key: 'vr_ret_ir', label: 'IR Retido' },
  { key: 'vr_ret_csll', label: 'CSLL Retido' },
  { key: 'vr_ret_pis', label: 'PIS Retido' },
  { key: 'vr_ret_cofins', label: 'COFINS Retido' },
  { key: 'vr_total_darf', label: 'Total DARF' },
  { key: 'data_fechamento', label: 'Data Fechamento' },
];

export function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

export function parseBRL(v: string): number {
  return Number(String(v || '0').replace(/\./g, '').replace(',', '.')) || 0;
}

export function buildR2099Rows(events: ReinfEvent[], period: ReinfPeriod | null): Record<string, string>[] {
  const t = period?.totals || {};
  const inss = Number(t.r2010_inss ?? 0);
  const base = inss > 0 ? inss / 0.11 : 0;
  const rows: Record<string, string>[] = events.map((e) => ({
    event_type: String(e.event_type),
    competencia: period?.competencia || '',
    status: e.status,
    qtd_r2010: String(t.r2010_qtd ?? 0),
    vr_base_inss: fmt(base),
    vr_ret_inss: fmt(inss),
    data_fechamento: period?.closed_at?.slice(0, 10) || '',
  }));
  rows.push({
    event_type: 'TOTAL', competencia: period?.competencia || '', status: '',
    qtd_r2010: String(t.r2010_qtd ?? 0),
    vr_base_inss: fmt(base),
    vr_ret_inss: fmt(inss),
    data_fechamento: '',
  });
  return rows;
}

export function buildR4099Rows(events: ReinfEvent[], period: ReinfPeriod | null): Record<string, string>[] {
  const t = period?.totals || {};
  const ir = Number(t.r4020_ir ?? 0);
  const csll = Number(t.r4020_csll ?? 0);
  const pis = Number(t.r4020_pis ?? 0);
  const cofins = Number(t.r4020_cofins ?? 0);
  const total = ir + csll + pis + cofins;
  const rows: Record<string, string>[] = events.map((e) => ({
    event_type: String(e.event_type),
    competencia: period?.competencia || '',
    status: e.status,
    qtd_r4020: String(t.r4020_qtd ?? 0),
    vr_ret_ir: fmt(ir),
    vr_ret_csll: fmt(csll),
    vr_ret_pis: fmt(pis),
    vr_ret_cofins: fmt(cofins),
    vr_total_darf: fmt(total),
    data_fechamento: period?.closed_at?.slice(0, 10) || '',
  }));
  rows.push({
    event_type: 'TOTAL', competencia: period?.competencia || '', status: '',
    qtd_r4020: String(t.r4020_qtd ?? 0),
    vr_ret_ir: fmt(ir), vr_ret_csll: fmt(csll), vr_ret_pis: fmt(pis), vr_ret_cofins: fmt(cofins),
    vr_total_darf: fmt(total), data_fechamento: '',
  });
  return rows;
}

export type ValidationResult = { ok: boolean; errors: string[] };

export function validateTotalsRow(
  rows: Record<string, string>[],
  expected: Record<string, number>,
  tolerance: number = REINF_TOLERANCE,
): ValidationResult {
  const errors: string[] = [];
  const totalRow = rows.find((r) => r.event_type === 'TOTAL');
  if (!totalRow) return { ok: false, errors: ['Linha TOTAL ausente no CSV.'] };
  for (const [key, exp] of Object.entries(expected)) {
    const got = parseBRL(totalRow[key]);
    const diff = Math.abs(got - exp);
    if (diff > tolerance) {
      errors.push(`${key}: CSV=${got.toFixed(2)} × Período=${exp.toFixed(2)} (Δ ${diff.toFixed(2)})`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function validateR2099Rows(rows: Record<string, string>[], period: ReinfPeriod | null): ValidationResult {
  const t = period?.totals || {};
  const inss = Number(t.r2010_inss ?? 0);
  const base = inss > 0 ? inss / 0.11 : 0;
  return validateTotalsRow(rows, { vr_base_inss: base, vr_ret_inss: inss });
}

export function validateR4099Rows(rows: Record<string, string>[], period: ReinfPeriod | null): ValidationResult {
  const t = period?.totals || {};
  const ir = Number(t.r4020_ir ?? 0);
  const csll = Number(t.r4020_csll ?? 0);
  const pis = Number(t.r4020_pis ?? 0);
  const cofins = Number(t.r4020_cofins ?? 0);
  return validateTotalsRow(rows, {
    vr_ret_ir: ir, vr_ret_csll: csll, vr_ret_pis: pis, vr_ret_cofins: cofins,
    vr_total_darf: ir + csll + pis + cofins,
  });
}
