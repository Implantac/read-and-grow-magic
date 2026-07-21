import type { LucideIcon } from 'lucide-react';

export interface ManualStep {
  title: string;
  description: string;
  tip?: string;
}

export interface ManualSection {
  heading: string;
  paragraphs: string[];
}

export interface ManualFAQ {
  q: string;
  a: string;
}

export interface ModuleManual {
  slug: string;
  title: string;
  category: 'Operacional' | 'Financeiro' | 'Fiscal' | 'Estratégico' | 'Administração' | 'Relacionamento';
  icon: LucideIcon;
  short: string;
  overview: string[];
  routes: { label: string; path: string }[];
  personas: string[];
  prerequisites: string[];
  steps: ManualStep[];
  sections: ManualSection[];
  faq: ManualFAQ[];
  troubleshooting: { problem: string; solution: string }[];
  videoUrl?: string;
  screenshots?: { title: string; description: string }[];
}

export type Difficulty = 'Iniciante' | 'Intermediário' | 'Avançado';

export interface BeginnerContent {
  /** 1 frase: o que este módulo faz, sem jargão */
  inPlainWords: string;
  /** Analogia com algo familiar (ex.: "é como uma agenda...") */
  analogy: string;
  /** 3 a 5 passos escritos como um amigo explicaria */
  plainSteps: string[];
  /** Termos técnicos traduzidos */
  glossary: { term: string; definition: string }[];
  /** Estimativa de tempo para ficar confortável */
  timeToLearn: string;
}

export const commonScreens = (labels: string[]) =>
  labels.map((title) => ({
    title,
    description: 'Captura de tela sugerida — grave o fluxo real da sua empresa para enriquecer o treinamento.',
  }));
