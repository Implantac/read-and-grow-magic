import type { NavSection } from '../types';

export const financeiroSection: NavSection = {
  label: 'Controladoria & Fiscal',
  items: [
    {
      title: 'Financeiro Core',
      href: '/financeiro',
      icon: 'Wallet',
      children: [
        { title: 'Central Financeira', href: '/financeiro/dashboard', icon: 'Zap' },
        { title: 'Fluxo de Caixa', href: '/financeiro/fluxo', icon: 'TrendingUp' },
        { title: 'DRE Dinâmica', href: '/financeiro/dre-dinamica', icon: 'BarChart3' },
        { title: 'Contas a Pagar', href: '/financeiro/pagar', icon: 'ArrowUpCircle' },
        { title: 'Contas a Receber', href: '/financeiro/receber', icon: 'ArrowDownCircle' },
        { title: 'Tesouraria & Bancos', href: '/financeiro/tesouraria', icon: 'Building2' },
        { title: 'Conciliação Bancária', href: '/financeiro/conciliacao', icon: 'CheckCircle' },
      ],
    },
    {
      title: 'Fiscal & Tributário',
      href: '/fiscal',
      icon: 'FileCheck',
      children: [
        { title: 'Painel Fiscal', href: '/fiscal/dashboard', icon: 'Gauge' },
        { title: 'Emissão NF-e / NFC-e', href: '/fiscal/nfe', icon: 'FileText' },
        { title: 'SPED & Obrigações', href: '/fiscal/sped', icon: 'FileDown' },
        { title: 'Regras de Impostos', href: '/fiscal/regras-fiscais', icon: 'Sliders' },
      ],
    },
    {
      title: 'Contabilidade',
      href: '/contabilidade',
      icon: 'Calculator',
      children: [
        { title: 'Plano de Contas', href: '/contabilidade/plano-contas', icon: 'FolderTree' },
        { title: 'Balancete & Balanço', href: '/contabilidade/balancete', icon: 'Scale' },
        { title: 'Razão Contábil', href: '/contabilidade/razao', icon: 'BookOpen' },
      ],
    },
  ],
};
