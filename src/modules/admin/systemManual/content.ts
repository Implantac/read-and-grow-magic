// Barrel: split into content-types, content-modules, content-beginner
export type {
  ManualStep,
  ManualSection,
  ManualFAQ,
  ModuleManual,
  Difficulty,
  BeginnerContent,
} from './content-types';

export { MANUAL_MODULES, MANUAL_CATEGORIES } from './content-modules';
export {
  MODULE_DIFFICULTY,
  MODULE_BEGINNER,
  DIFFICULTY_STYLE,
  getBeginner,
  getDifficulty,
} from './content-beginner';

export interface ManualSection {
  id: string;
  title: string;
  description: string;
  modules: string[];
}

export const SYSTEM_MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'intro',
    title: '1. Primeiros Passos (Configuração)',
    description: 'Prepare a base do seu ERP para começar a operar.',
    modules: ['admin-empresas', 'admin-usuarios', 'fiscal']
  },
  {
    id: 'estoque',
    title: '2. Gestão de Produtos e Estoque',
    description: 'Cadastre o que você vende e controle onde as coisas estão.',
    modules: ['estoque', 'wms', 'compras']
  },
  {
    id: 'vendas',
    title: '3. Comercial e Faturamento',
    description: 'Venda seus produtos e emita as notas fiscais.',
    modules: ['comercial', 'fiscal', 'crm-nps']
  },
  {
    id: 'financeiro',
    title: '4. Financeiro e Controladoria',
    description: 'Controle o dinheiro, pague contas e veja seu lucro.',
    modules: ['financeiro', 'contabilidade', 'executivo']
  },
  {
    id: 'logistica',
    title: '5. Logística Avançada e Entrega',
    description: 'Entregue seus produtos com eficiência.',
    modules: ['tms', 'rfid']
  }
];

