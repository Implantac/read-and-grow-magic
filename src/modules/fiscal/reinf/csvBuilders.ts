import type { ReinfEvent } from '@/hooks/fiscal/useReinf';
import { toast } from 'sonner';
import type { ValidationResult } from '../reinfCsv';

export const R2010_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'cnpj_prestador', label: 'CNPJ Prestador' },
  { key: 'nota_fiscal', label: 'Nota Fiscal' },
  { key: 'data_emissao', label: 'Data Emissão' },
  { key: 'cod_serv', label: 'Cód. Serviço' },
  { key: 'vr_bruto', label: 'Valor Bruto' },
  { key: 'vr_base_inss', label: 'Base INSS' },
  { key: 'vr_ret_inss', label: 'INSS Retido (11%)' },
  { key: 'status', label: 'Status' },
];

export const R4020_HEADERS = [
  { key: 'event_type', label: 'Evento' },
  { key: 'cnpj_beneficiario', label: 'CNPJ Beneficiário' },
  { key: 'nota_fiscal', label: 'Nota Fiscal' },
  { key: 'data_emissao', label: 'Data Emissão' },
  { key: 'cod_receita', label: 'Cód. Receita' },
  { key: 'vr_bruto', label: 'Valor Bruto' },
  { key: 'vr_ret_ir', label: 'IR (1,5%)' },
  { key: 'vr_ret_csll', label: 'CSLL (1%)' },
  { key: 'vr_ret_pis', label: 'PIS (0,65%)' },
  { key: 'vr_ret_cofins', label: 'COFINS (3%)' },
  { key: 'vr_total_ret', label: 'Total Retido' },
  { key: 'status', label: 'Status' },
];

function num(v: unknown): number {
  return Number(v || 0);
}

export function buildR2010Rows(events: ReinfEvent[]): Record<string, string>[] {
  const rows: Record<string, string>[] = events.map((e) => ({
    event_type: String(e.event_type),
    cnpj_prestador: e.cnpj_prestador || '',
    nota_fiscal: e.nota_fiscal || '',
    data_emissao: e.data_emissao || '',
    cod_serv: e.cod_serv || '',
    vr_bruto: num(e.vr_bruto).toFixed(2).replace('.', ','),
    vr_base_inss: num(e.vr_bruto).toFixed(2).replace('.', ','),
    vr_ret_inss: num(e.vr_ret_inss).toFixed(2).replace('.', ','),
    status: e.status,
  }));
  const totalBruto = events.reduce((s, e) => s + num(e.vr_bruto), 0);
  const totalInss = events.reduce((s, e) => s + num(e.vr_ret_inss), 0);
  rows.push({
    event_type: 'TOTAL',
    cnpj_prestador: '', nota_fiscal: '', data_emissao: '', cod_serv: '',
    vr_bruto: totalBruto.toFixed(2).replace('.', ','),
    vr_base_inss: totalBruto.toFixed(2).replace('.', ','),
    vr_ret_inss: totalInss.toFixed(2).replace('.', ','),
    status: '',
  });
  return rows;
}

export function buildR4020Rows(events: ReinfEvent[]): Record<string, string>[] {
  const rows: Record<string, string>[] = events.map((e) => {
    const total = num(e.vr_ret_ir) + num(e.vr_ret_csll) + num(e.vr_ret_pis) + num(e.vr_ret_cofins);
    return {
      event_type: String(e.event_type),
      cnpj_beneficiario: e.cnpj_beneficiario || '',
      nota_fiscal: e.nota_fiscal || '',
      data_emissao: e.data_emissao || '',
      cod_receita: e.cod_receita || '',
      vr_bruto: num(e.vr_bruto).toFixed(2).replace('.', ','),
      vr_ret_ir: num(e.vr_ret_ir).toFixed(2).replace('.', ','),
      vr_ret_csll: num(e.vr_ret_csll).toFixed(2).replace('.', ','),
      vr_ret_pis: num(e.vr_ret_pis).toFixed(2).replace('.', ','),
      vr_ret_cofins: num(e.vr_ret_cofins).toFixed(2).replace('.', ','),
      vr_total_ret: total.toFixed(2).replace('.', ','),
      status: e.status,
    };
  });
  const sum = (k: keyof ReinfEvent) => events.reduce((s, e) => s + num(e[k] as any), 0);
  const totals = {
    bruto: sum('vr_bruto'), ir: sum('vr_ret_ir'), csll: sum('vr_ret_csll'),
    pis: sum('vr_ret_pis'), cofins: sum('vr_ret_cofins'),
  };
  const totalRet = totals.ir + totals.csll + totals.pis + totals.cofins;
  rows.push({
    event_type: 'TOTAL',
    cnpj_beneficiario: '', nota_fiscal: '', data_emissao: '', cod_receita: '',
    vr_bruto: totals.bruto.toFixed(2).replace('.', ','),
    vr_ret_ir: totals.ir.toFixed(2).replace('.', ','),
    vr_ret_csll: totals.csll.toFixed(2).replace('.', ','),
    vr_ret_pis: totals.pis.toFixed(2).replace('.', ','),
    vr_ret_cofins: totals.cofins.toFixed(2).replace('.', ','),
    vr_total_ret: totalRet.toFixed(2).replace('.', ','),
    status: '',
  });
  return rows;
}

export function guardExport(
  label: string,
  validator: () => ValidationResult,
  onOk: () => void,
) {
  const result = validator();
  if (!result.ok) {
    toast.error(`Divergência no ${label}`, {
      description: `Totais do CSV não conferem com o período. ${result.errors.join(' • ')}`,
    });
    return;
  }
  onOk();
  toast.success(`${label} validado`, { description: 'Linha TOTAL bate com o consolidado do período.' });
}
