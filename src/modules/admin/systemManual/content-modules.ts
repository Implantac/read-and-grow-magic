import type { ModuleManual } from './content-types';
import { ESTRATEGICO_MODULES } from './content-modules/estrategico';
import { OPERACIONAL_MODULES } from './content-modules/operacional';
import { FINANCEIRO_MODULES } from './content-modules/financeiro';
import { FISCAL_MODULES } from './content-modules/fiscal';
import { RELACIONAMENTO_MODULES } from './content-modules/relacionamento';
import { ADMINISTRACAO_MODULES } from './content-modules/administracao';

export const MANUAL_MODULES: ModuleManual[] = [
  ESTRATEGICO_MODULES[0], // Dashboard first
  ...OPERACIONAL_MODULES.slice(0, 1), // Comercial
  ...FINANCEIRO_MODULES.slice(0, 1),  // Financeiro
  ...FISCAL_MODULES,                  // Fiscal
  ...OPERACIONAL_MODULES.slice(1, 5), // Produção, WMS, Compras, Estoque
  ...FINANCEIRO_MODULES.slice(1),     // Contabilidade
  ...OPERACIONAL_MODULES.slice(5, 6), // TMS
  ...RELACIONAMENTO_MODULES,
  ...ESTRATEGICO_MODULES.slice(1, 2), // Executivo
  ...ADMINISTRACAO_MODULES,
  ...OPERACIONAL_MODULES.slice(6),    // RFID
  ...ESTRATEGICO_MODULES.slice(2),    // Relatórios
];

export const MANUAL_CATEGORIES: Record<ModuleManual['category'], { color: string; description: string }> = {
  Operacional: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', description: 'Módulos do dia a dia da operação' },
  Financeiro: { color: 'bg-green-500/10 text-green-500 border-green-500/30', description: 'Controle financeiro e contábil' },
  Fiscal: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', description: 'Documentos e obrigações fiscais' },
  Estratégico: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/30', description: 'Visão executiva e IA' },
  Administração: { color: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/30', description: 'Configuração e segurança' },
  Relacionamento: { color: 'bg-pink-500/10 text-pink-500 border-pink-500/30', description: 'CX, NPS e pós-venda' },
};
