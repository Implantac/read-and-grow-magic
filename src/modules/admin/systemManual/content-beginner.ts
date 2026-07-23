import type { BeginnerContent, Difficulty } from './content-types';
import { FALLBACK_BEGINNER } from './content-beginner-data';
import { MODULE_BEGINNER_CORE } from './content-beginner-core';
import { MODULE_BEGINNER_LOGISTICS } from './content-beginner-logistics';
import { MODULE_BEGINNER_ADMIN } from './content-beginner-admin';

export const MODULE_DIFFICULTY: Record<string, Difficulty> = {
  dashboard: 'Iniciante',
  comercial: 'Iniciante',
  financeiro: 'Intermediário',
  fiscal: 'Avançado',
  producao: 'Avançado',
  wms: 'Intermediário',
  compras: 'Iniciante',
  estoque: 'Iniciante',
  contabilidade: 'Avançado',
  tms: 'Intermediário',
  'crm-nps': 'Iniciante',
  executivo: 'Iniciante',
  'admin-usuarios': 'Intermediário',
  'admin-empresas': 'Intermediário',
  'admin-parametros': 'Intermediário',
  'admin-seguranca': 'Avançado',
  billing: 'Iniciante',
  rfid: 'Avançado',
  relatorios: 'Iniciante',
};

export const MODULE_BEGINNER: Record<string, BeginnerContent> = {
  ...MODULE_BEGINNER_CORE,
  ...MODULE_BEGINNER_LOGISTICS,
  ...MODULE_BEGINNER_ADMIN,
};

export function getBeginner(slug: string): BeginnerContent {
  return MODULE_BEGINNER[slug] ?? FALLBACK_BEGINNER;
}

export function getDifficulty(slug: string): Difficulty {
  return MODULE_DIFFICULTY[slug] ?? 'Intermediário';
}

export const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Iniciante: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Intermediário: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Avançado: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
};
