import { Briefcase, Calculator, Factory, Warehouse, ShieldCheck, HeartHandshake, type LucideIcon } from 'lucide-react';

export interface LearningPath {
  id: string;
  title: string;
  persona: string;
  description: string;
  icon: LucideIcon;
  color: string;
  modules: string[]; // ordered slugs
  outcome: string;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'implantador',
    title: 'Trilha do Implantador',
    persona: 'Consultor / TI / Key User',
    description: 'Sequência recomendada para quem vai preparar o sistema do zero até o primeiro pedido.',
    icon: ShieldCheck,
    color: 'text-primary',
    modules: ['admin-empresas', 'admin-usuarios', 'admin-parametros', 'admin-seguranca', 'estoque', 'fiscal', 'comercial', 'financeiro'],
    outcome: 'Sistema parametrizado, usuários criados, primeiro pedido emitindo NF-e.',
  },
  {
    id: 'financeiro',
    title: 'Trilha do Financeiro',
    persona: 'Analista / Gerente Financeiro',
    description: 'Do plano de contas ao fechamento contábil, passando por AP/AR e conciliação.',
    icon: Calculator,
    color: 'text-emerald-500',
    modules: ['financeiro', 'contabilidade', 'billing', 'executivo'],
    outcome: 'Fluxo de caixa saudável, contas conciliadas, DRE mensal fechado.',
  },
  {
    id: 'comercial',
    title: 'Trilha do Comercial',
    persona: 'Vendedor / Gerente de Vendas',
    description: 'Do lead ao pedido faturado, aprendendo a usar o funil, catálogo e IA de vendas.',
    icon: Briefcase,
    color: 'text-blue-500',
    modules: ['comercial', 'estoque', 'crm-nps', 'relatorios'],
    outcome: 'Pipeline organizado, propostas rápidas e NPS acompanhado.',
  },
  {
    id: 'operacao',
    title: 'Trilha da Operação',
    persona: 'Operador / Supervisor de CD',
    description: 'Rotinas diárias de recebimento, endereçamento, separação e expedição.',
    icon: Warehouse,
    color: 'text-orange-500',
    modules: ['wms', 'estoque', 'rfid', 'tms'],
    outcome: 'Pedidos separados dentro do SLA, acuracidade > 99%.',
  },
  {
    id: 'industria',
    title: 'Trilha da Indústria',
    persona: 'PCP / Chão de Fábrica',
    description: 'MRP, ordens de produção, apontamento e OEE — do planejamento ao produto acabado.',
    icon: Factory,
    color: 'text-purple-500',
    modules: ['producao', 'estoque', 'compras', 'wms'],
    outcome: 'Ordens de produção fluindo com OEE monitorado em tempo real.',
  },
  {
    id: 'fiscal',
    title: 'Trilha Fiscal',
    persona: 'Analista Fiscal / Contador',
    description: 'Configuração tributária, emissão de NF-e, SPED e obrigações acessórias.',
    icon: ShieldCheck,
    color: 'text-rose-500',
    modules: ['fiscal', 'contabilidade', 'financeiro', 'relatorios'],
    outcome: 'NF-e autorizada sem rejeição e SPEDs entregues no prazo.',
  },
  {
    id: 'cx',
    title: 'Trilha de Relacionamento',
    persona: 'Sucesso do Cliente / CX',
    description: 'NPS, churn, health score e workflows de retenção.',
    icon: HeartHandshake,
    color: 'text-pink-500',
    modules: ['crm-nps', 'comercial', 'executivo'],
    outcome: 'NPS medido, clientes em risco identificados e workflows acionados.',
  },
];
