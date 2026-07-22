import { LayoutDashboard, Brain, BarChart3 } from 'lucide-react';
import { commonScreens, type ModuleManual } from '../content-types';

export const ESTRATEGICO_MODULES: ModuleManual[] = [
  {
    slug: 'dashboard',
    title: 'Dashboard Executivo',
    category: 'Estratégico',
    icon: LayoutDashboard,
    short: 'Visão consolidada de KPIs, alertas e atividades em tempo real.',
    overview: [
      'O Dashboard é a porta de entrada do sistema. Ele consolida indicadores de todos os módulos ativos e destaca alertas que exigem ação imediata.',
      'Os cartões são adaptativos: variam conforme o segmento (têxtil, farma, distribuição) e o plano contratado.',
    ],
    routes: [{ label: 'Início', path: '/' }],
    personas: ['Diretor', 'Gerente', 'Administrador'],
    prerequisites: ['Usuário autenticado com empresa vinculada', 'Ao menos um módulo operacional em uso'],
    steps: [
      { title: 'Acesse a página inicial', description: 'Após login, o Dashboard carrega automaticamente com KPIs do dia.', tip: 'Use Ctrl+K para abrir o Command Palette e navegar entre módulos.' },
      { title: 'Interprete os KPIs', description: 'Verde = meta atingida, amarelo = atenção, vermelho = crítico. Clique no KPI para drill-down.' },
      { title: 'Revise alertas', description: 'A caixa de alertas concentra pendências (aprovações, estoque, financeiro). Marque como lido após ação.' },
      { title: 'Consulte a IA Executiva', description: 'Use o painel do Cérebro para pedir resumos, previsões e recomendações baseadas nos dados reais.' },
    ],
    sections: [
      { heading: 'Boas práticas', paragraphs: ['Revise o Dashboard diariamente antes das reuniões operacionais.', 'Configure metas em Administração → Parâmetros para calibrar os semáforos.'] },
    ],
    faq: [
      { q: 'Por que meus KPIs estão zerados?', a: 'Provavelmente o módulo correspondente ainda não tem lançamentos ou o filtro de empresa está incorreto. Verifique o seletor de empresa no topo.' },
      { q: 'Posso personalizar os cartões?', a: 'Sim, via Administração → Dashboards (Dashboard Engine).' },
    ],
    troubleshooting: [
      { problem: 'Gráficos não carregam', solution: 'Verifique conexão e permissões de leitura do módulo de origem.' },
    ],
    screenshots: commonScreens(['Tela inicial com KPIs', 'Drill-down de um KPI', 'Painel de alertas']),
  },
  {
    slug: 'executivo',
    title: 'IA Executiva (Cérebro)',
    category: 'Estratégico',
    icon: Brain,
    short: 'Diretor Digital: análises, previsões, ações via tool calling.',
    overview: ['Agente multi-agente com memória, decisões guardrails e cron autopilot 07:00 UTC. Consulta dados reais e executa ações no ERP.'],
    routes: [
      { label: 'Cérebro', path: '/executivo/cerebro' },
      { label: 'Learning', path: '/executivo/brain-learning' },
    ],
    personas: ['Diretor', 'Gerente'],
    prerequisites: ['Módulos operacionais com dados históricos'],
    steps: [
      { title: 'Abrir Cérebro', description: 'Faça perguntas em linguagem natural: "Como estão minhas vendas vs mês passado?"' },
      { title: 'Autorizar ações', description: 'Ações críticas exigem confirmação (guardrails).' },
      { title: 'Configurar autopilot', description: 'Learning → escolha rotinas automáticas (relatórios, alertas).' },
    ],
    sections: [],
    faq: [{ q: 'IA errou uma resposta?', a: 'Corrija no Learning — a memória evolui com feedback.' }],
    troubleshooting: [{ problem: 'IA não responde', solution: 'Verifique Lovable AI Gateway ativo e créditos disponíveis.' }],
    screenshots: commonScreens(['Chat com o Cérebro', 'Autopilot']),
  },
  {
    slug: 'relatorios',
    title: 'Relatórios',
    category: 'Estratégico',
    icon: BarChart3,
    short: 'Relatórios prontos: vendas, financeiro, produção, estoque.',
    overview: ['Relatórios exportáveis (PDF/Excel) com filtros avançados por período, empresa, centro de custo.'],
    routes: [
      { label: 'Vendas', path: '/relatorios/vendas' },
      { label: 'Financeiro', path: '/relatorios/financeiro' },
      { label: 'Produção', path: '/relatorios/producao' },
      { label: 'Estoque', path: '/relatorios/estoque' },
    ],
    personas: ['Todos gestores'],
    prerequisites: [],
    steps: [
      { title: 'Escolher relatório', description: 'Menu Relatórios → módulo desejado.' },
      { title: 'Aplicar filtros', description: 'Período, empresa, categoria — mais filtros = mais precisão.' },
      { title: 'Exportar', description: 'PDF para apresentação; Excel para análise adicional.' },
    ],
    sections: [],
    faq: [{ q: 'Posso agendar?', a: 'Sim — via Executive Reporting (WhatsApp diário) ou workflows.' }],
    troubleshooting: [{ problem: 'Export lento', solution: 'Reduza período ou filtre por empresa.' }],
    screenshots: commonScreens(['Filtros', 'Preview de relatório']),
  },
];
