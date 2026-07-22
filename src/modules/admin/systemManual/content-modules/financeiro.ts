import { DollarSign, BookOpen } from 'lucide-react';
import { commonScreens, type ModuleManual } from '../content-types';

export const FINANCEIRO_MODULES: ModuleManual[] = [
  {
    slug: 'financeiro',
    title: 'Financeiro',
    category: 'Financeiro',
    icon: DollarSign,
    short: 'Contas a pagar/receber, tesouraria, fluxo de caixa e conciliação.',
    overview: [
      'Controla todo o financeiro: AP (a pagar), AR (a receber), bancos, fluxo de caixa 30 dias e conciliação bancária via OFX/CSV.',
      'DRE em tempo real e integração com contabilidade (partidas dobradas automáticas).',
    ],
    routes: [
      { label: 'Contas a Pagar', path: '/financeiro/contas-pagar' },
      { label: 'Contas a Receber', path: '/financeiro/contas-receber' },
      { label: 'Tesouraria', path: '/financeiro/tesouraria' },
      { label: 'Conciliação', path: '/financeiro/conciliacao' },
    ],
    personas: ['Financeiro', 'Contábil', 'Diretor'],
    prerequisites: ['Bancos cadastrados', 'Plano de contas configurado'],
    steps: [
      { title: 'Lançar conta a pagar', description: 'Contas a Pagar → Nova. Informe fornecedor, vencimento, valor e conta contábil.' },
      { title: 'Importar extrato', description: 'Conciliação → Importar OFX/CSV. O motor faz match automático com lançamentos.', tip: 'O cron das 06:00 UTC roda conciliação diária e alerta divergências.' },
      { title: 'Analisar fluxo de caixa', description: 'Tesouraria → Fluxo 30d mostra projeção com base em vencimentos.' },
      { title: 'Gerar DRE', description: 'Contabilidade → DRE (gerencial ou legal) — exportável em PDF/Excel.' },
    ],
    sections: [
      { heading: 'Automações', paragraphs: ['NF-e autorizada gera AR automaticamente.', 'Baixa de AP pode ser em lote com seleção múltipla.'] },
    ],
    faq: [
      { q: 'Extrato não bate?', a: 'Use Conciliação Manual para vincular lançamentos avulsos e crie regras para automatizar próximas cargas.' },
    ],
    troubleshooting: [
      { problem: 'DRE zerada', solution: 'Confirme que há lançamentos contábeis no período e que o plano de contas está mapeado.' },
    ],
    screenshots: commonScreens(['Lista AP', 'Conciliação bancária', 'DRE gerencial']),
  },
  {
    slug: 'contabilidade',
    title: 'Contabilidade',
    category: 'Financeiro',
    icon: BookOpen,
    short: 'Plano de contas, lançamentos, razão, balancete, DRE e balanço.',
    overview: ['Contabilidade em partidas dobradas com integração automática dos demais módulos.'],
    routes: [
      { label: 'Plano de Contas', path: '/contabilidade/plano-contas' },
      { label: 'Lançamentos', path: '/contabilidade/lancamentos' },
      { label: 'DRE', path: '/contabilidade/dre' },
      { label: 'Balanço', path: '/contabilidade/balanco' },
      { label: 'Fechamento', path: '/contabilidade/fechamento' },
    ],
    personas: ['Contábil', 'Financeiro'],
    prerequisites: ['Plano de contas aderente ao regime da empresa'],
    steps: [
      { title: 'Importar plano de contas', description: 'Use CSV modelo ou parta do plano padrão.' },
      { title: 'Revisar lançamentos automáticos', description: 'Cada NF-e, baixa e folha gera partida — revise divergências.' },
      { title: 'Fechar período', description: 'Fechamento bloqueia edições e gera saldo de abertura do próximo mês.' },
    ],
    sections: [],
    faq: [{ q: 'DRE não fecha?', a: 'Verifique contas sem classificação DRE no plano de contas.' }],
    troubleshooting: [{ problem: 'Erro no fechamento', solution: 'Cheque lançamentos desbalanceados na tela de lançamentos.' }],
    screenshots: commonScreens(['Plano de contas', 'Razão', 'DRE']),
  },
];
