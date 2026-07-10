import {
  LayoutDashboard, ShoppingCart, DollarSign, FileText, Factory, Warehouse,
  Truck, Package, BookOpen, Users, Building2, Settings, ShieldCheck, Brain,
  HeartHandshake, BarChart3, Boxes, Radio, CreditCard,
  type LucideIcon,
} from 'lucide-react';

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

const commonScreens = (labels: string[]) =>
  labels.map((title) => ({ title, description: 'Captura de tela sugerida — grave o fluxo real da sua empresa para enriquecer o treinamento.' }));

export const MANUAL_MODULES: ModuleManual[] = [
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
    slug: 'comercial',
    title: 'Comercial & Vendas',
    category: 'Operacional',
    icon: ShoppingCart,
    short: 'Pipeline de vendas, pedidos, clientes e automação com IA.',
    overview: [
      'O módulo Comercial gerencia todo o ciclo B2B/B2C: cadastro de clientes, propostas, pedidos, pipeline Kanban e faturamento.',
      'Integra-se automaticamente com Estoque (reserva), Fiscal (NF-e) e Financeiro (contas a receber).',
    ],
    routes: [
      { label: 'Clientes', path: '/comercial/clientes' },
      { label: 'Pedidos', path: '/comercial/pedidos' },
      { label: 'Pipeline', path: '/comercial/pipeline' },
    ],
    personas: ['Comercial', 'Gerente de Vendas', 'Diretor'],
    prerequisites: ['Cadastro de produtos ativo', 'Tabela de preços configurada', 'Módulo Fiscal para emissão de NF-e'],
    steps: [
      { title: 'Cadastrar cliente', description: 'Vá em Comercial → Clientes → Novo. Informe CNPJ e o sistema busca dados via BrasilAPI.' },
      { title: 'Criar pedido', description: 'Em Pedidos → Novo, selecione cliente, adicione itens, revise impostos calculados automaticamente.' },
      { title: 'Acompanhar no pipeline', description: 'Arraste o card entre colunas (Prospect → Proposta → Fechado). Cada mudança é auditada.' },
      { title: 'Faturar', description: 'Ao mover para "Faturamento", o sistema gera a NF-e e o AR automaticamente.', tip: 'Confira o CFOP sugerido pelo motor fiscal antes de emitir.' },
    ],
    sections: [
      { heading: 'Automação com IA', paragraphs: ['O assistente de vendas sugere próximos passos, produtos complementares e detecta risco de churn.'] },
      { heading: 'Gamificação', paragraphs: ['Ranking e badges motivam a equipe. Configure metas mensais em Parâmetros.'] },
    ],
    faq: [
      { q: 'Cliente não aparece na busca?', a: 'Verifique se está ativo e se pertence à empresa selecionada no topo.' },
      { q: 'Como conceder desconto?', a: 'Descontos acima da alçada geram workflow de aprovação automático.' },
    ],
    troubleshooting: [
      { problem: 'Pedido não fatura', solution: 'Confirme estoque disponível, limite de crédito do cliente e certificado NF-e válido.' },
    ],
    screenshots: commonScreens(['Lista de clientes', 'Novo pedido — itens', 'Pipeline Kanban']),
  },
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
    slug: 'fiscal',
    title: 'Fiscal',
    category: 'Fiscal',
    icon: FileText,
    short: 'NF-e/NFC-e, SPED, DIFAL, ICMS-ST e motor de cálculo tributário.',
    overview: [
      'Emissão de documentos fiscais (NF-e 4.00, NFC-e), geração de SPED Fiscal/Contribuições, cálculo automático de tributos e importação de XML.',
    ],
    routes: [
      { label: 'Painel Fiscal', path: '/fiscal' },
      { label: 'Regras Tributárias', path: '/fiscal/regras' },
      { label: 'SPED', path: '/fiscal/sped' },
      { label: 'Certificado', path: '/fiscal/certificado' },
    ],
    personas: ['Fiscal', 'Contábil'],
    prerequisites: ['Certificado A1 instalado', 'CFOPs e CSTs configurados', 'Regime tributário definido'],
    steps: [
      { title: 'Cadastrar certificado', description: 'Fiscal → Certificado → Upload do .pfx com senha. Válido para NF-e e Reinf.' },
      { title: 'Configurar regras', description: 'Regras Tributárias por UF, CFOP, NCM. O motor aplica automaticamente nos pedidos.' },
      { title: 'Importar XML de entrada', description: 'Fiscal → Importar XML. Revise itens, vincule produtos e confirme.' },
      { title: 'Gerar SPED', description: 'SPED → selecione período → gerar TXT. Valide no PVA antes de transmitir.' },
    ],
    sections: [
      { heading: 'Wizards guiados', paragraphs: ['Emissão em etapas com FiscalStepper, SmartSelect de NCM/CFOP e TaxSummaryCard para revisão antes do envio.'] },
    ],
    faq: [
      { q: 'Rejeição 999?', a: 'Erro genérico — abra o painel de status SEFAZ (sefaz_status_uf) e verifique operação da UF.' },
    ],
    troubleshooting: [
      { problem: 'Certificado inválido', solution: 'Confirme validade e senha. Renove antes do vencimento — o sistema alerta 30 dias antes.' },
    ],
    screenshots: commonScreens(['Painel fiscal', 'Wizard NF-e', 'Importação XML']),
  },
  {
    slug: 'producao',
    title: 'Produção (PCP)',
    category: 'Operacional',
    icon: Factory,
    short: 'Ordens de produção, MRP, OEE, apontamentos e Kanban de chão de fábrica.',
    overview: [
      'PCP completo: BOM, roteiro, MRP, ordens, apontamentos em tempo real, cálculo de OEE e Kanban por centro de trabalho.',
    ],
    routes: [
      { label: 'Ordens de Produção', path: '/producao/ordens' },
      { label: 'BOM', path: '/producao/bom' },
      { label: 'MRP', path: '/producao/mrp' },
    ],
    personas: ['Produção', 'PCP', 'Gerente Industrial'],
    prerequisites: ['Produtos com BOM cadastrada', 'Centros de trabalho definidos'],
    steps: [
      { title: 'Cadastrar BOM', description: 'Produção → BOM → Novo. Adicione componentes, quantidades e perdas.' },
      { title: 'Rodar MRP', description: 'MRP → Rodar. O sistema sugere ordens de compra e produção com base em demanda + estoque.' },
      { title: 'Abrir OP', description: 'Ordens → Nova → escolha produto, quantidade e data. Materiais são reservados.' },
      { title: 'Apontar produção', description: 'No terminal de chão de fábrica, operador aponta início/fim, quantidade e refugo.' },
    ],
    sections: [
      { heading: 'OEE', paragraphs: ['Calculado automaticamente a partir dos apontamentos (Disponibilidade × Performance × Qualidade).'] },
    ],
    faq: [
      { q: 'MRP não sugere nada?', a: 'Verifique previsão de vendas e leadtime dos itens.' },
    ],
    troubleshooting: [
      { problem: 'Ordem trava em "Aguardando material"', solution: 'Falta estoque de componente — cheque no MRP ou libere via compra emergencial.' },
    ],
    screenshots: commonScreens(['Lista de OPs', 'BOM', 'Kanban chão de fábrica']),
  },
  {
    slug: 'wms',
    title: 'WMS — Armazém',
    category: 'Operacional',
    icon: Warehouse,
    short: 'Recebimento, endereçamento, picking, packing e inventário rotativo.',
    overview: [
      'Gestão de múltiplos CDs, entradas, put-away, ondas de picking, packing e expedição. Suporta RFID e coletores.',
    ],
    routes: [
      { label: 'Recebimento', path: '/wms/recebimento' },
      { label: 'Endereços', path: '/wms/enderecos' },
      { label: 'Picking', path: '/wms/picking' },
      { label: 'Expedição', path: '/wms/expedicao' },
    ],
    personas: ['Logística', 'Operador de armazém'],
    prerequisites: ['CDs e endereços cadastrados', 'Coletores/leitores configurados (opcional)'],
    steps: [
      { title: 'Receber mercadoria', description: 'Recebimento → escaneie NF-e de entrada → confira quantidades.' },
      { title: 'Endereçar', description: 'Put-away sugere endereço ideal com base em curva ABC e volume.' },
      { title: 'Planejar onda', description: 'Picking → gerar onda agrupa pedidos por região do armazém.' },
      { title: 'Expedir', description: 'Após packing, gere manifesto e vincule ao TMS.' },
    ],
    sections: [
      { heading: 'Coletor mobile', paragraphs: ['Rota /coletor tem UI mobile-first otimizada para operação com scanner.'] },
    ],
    faq: [{ q: 'Divergência de estoque?', a: 'Rode inventário rotativo em WMS → Inventário. Ajustes geram trilha de auditoria.' }],
    troubleshooting: [
      { problem: 'Picking sem sugestão', solution: 'Verifique se produtos têm endereço cadastrado e saldo disponível.' },
    ],
    screenshots: commonScreens(['Tela do coletor', 'Onda de picking', 'Mapa de endereços']),
  },
  {
    slug: 'compras',
    title: 'Compras',
    category: 'Operacional',
    icon: Package,
    short: 'Requisições, cotações, pedidos de compra e homologação de fornecedores.',
    overview: ['Fluxo completo: requisição → cotação múltipla → aprovação → PO → recebimento.'],
    routes: [
      { label: 'Pedidos de Compra', path: '/compras/pedidos' },
      { label: 'Cotações', path: '/compras/cotacoes' },
      { label: 'Fornecedores', path: '/compras/fornecedores' },
      { label: 'Aprovações', path: '/compras/aprovacoes' },
    ],
    personas: ['Compras', 'Gerente', 'Diretor'],
    prerequisites: ['Fornecedores cadastrados', 'Alçadas de aprovação definidas'],
    steps: [
      { title: 'Criar requisição', description: 'Comece por Requisições ou direto do MRP.' },
      { title: 'Solicitar cotação', description: 'Envie a múltiplos fornecedores; compare preços, prazo e frete.' },
      { title: 'Aprovar', description: 'Aprovadores recebem no Workflow Inbox — aprove ou rejeite com justificativa.' },
      { title: 'Emitir PO', description: 'PO enviado por e-mail ao fornecedor; recebimento vincula no WMS.' },
    ],
    sections: [],
    faq: [{ q: 'Como definir alçadas?', a: 'Administração → Workflows → configure regras por valor e centro de custo.' }],
    troubleshooting: [
      { problem: 'PO não avança', solution: 'Confira aprovações pendentes no Workflow Inbox.' },
    ],
    screenshots: commonScreens(['Cotação comparativa', 'Aprovação de PO']),
  },
  {
    slug: 'estoque',
    title: 'Estoque',
    category: 'Operacional',
    icon: Boxes,
    short: 'Produtos, Kardex, curva ABC, categorias e ajustes.',
    overview: ['Controle de saldos, movimentações, curva ABC e gestão de categorias.'],
    routes: [
      { label: 'Produtos', path: '/estoque/produtos' },
      { label: 'Kardex', path: '/estoque/kardex' },
      { label: 'Categorias', path: '/estoque/categorias' },
    ],
    personas: ['Logística', 'Compras', 'Comercial'],
    prerequisites: ['Unidades de medida e categorias definidas'],
    steps: [
      { title: 'Cadastrar produto', description: 'Informe SKU, NCM, unidade, categoria e políticas de estoque.' },
      { title: 'Consultar Kardex', description: 'Rastreie toda entrada/saída com origem (venda, compra, produção, ajuste).' },
      { title: 'Analisar curva ABC', description: 'Prioriza gestão de itens com maior giro/valor.' },
    ],
    sections: [],
    faq: [{ q: 'Não consigo excluir produto', a: 'Proteção contra exclusão: existem movimentos vinculados. Inative em vez de excluir.' }],
    troubleshooting: [{ problem: 'Saldo negativo', solution: 'Rode inventário e revise apontamentos de produção.' }],
    screenshots: commonScreens(['Ficha do produto', 'Kardex']),
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
  {
    slug: 'tms',
    title: 'TMS — Transporte',
    category: 'Operacional',
    icon: Truck,
    short: 'Roteirização, frota, POD, live tracking e manifesto.',
    overview: ['Gestão de transportadoras, veículos, rotas otimizadas (TSP), comprovantes de entrega e rastreamento ao vivo.'],
    routes: [
      { label: 'Dashboard TMS', path: '/tms/dashboard' },
      { label: 'Rotas', path: '/tms/rotas' },
      { label: 'Frota', path: '/tms/veiculos' },
      { label: 'Live Tracking', path: '/tms/rastreamento' },
    ],
    personas: ['Logística', 'Expedição'],
    prerequisites: ['Veículos e motoristas cadastrados'],
    steps: [
      { title: 'Planejar rota', description: 'Selecione pedidos prontos, sistema otimiza (TSP) e sugere sequência.' },
      { title: 'Gerar manifesto', description: 'Vincula ao veículo e emite documento.' },
      { title: 'Capturar POD', description: 'Motorista fotografa comprovante no app; entrega é atualizada automaticamente.' },
    ],
    sections: [],
    faq: [{ q: 'Rota longa demais?', a: 'Ajuste restrições (peso, janela de entrega) e re-otimize.' }],
    troubleshooting: [{ problem: 'Live tracking sem posição', solution: 'Verifique se o app do motorista está logado e com GPS ativo.' }],
    screenshots: commonScreens(['Planejador de rotas', 'POD']),
  },
  {
    slug: 'crm-nps',
    title: 'Relacionamento & NPS',
    category: 'Relacionamento',
    icon: HeartHandshake,
    short: 'Campanhas NPS, convites, respostas, CX e follow-up.',
    overview: ['Gestão de pesquisas NPS com campanhas, convites por link/e-mail, coleta e análise por segmento.'],
    routes: [
      { label: 'Campanhas', path: '/relacionamento/nps/campanhas' },
      { label: 'Convites', path: '/relacionamento/nps/convites' },
      { label: 'Respostas', path: '/relacionamento/nps/respostas' },
    ],
    personas: ['CX', 'Comercial', 'Marketing'],
    prerequisites: ['Base de clientes/contatos importada'],
    steps: [
      { title: 'Criar campanha', description: 'Campanhas → Nova. Defina público, canal e período.' },
      { title: 'Gerar convites', description: 'Convites → Gerar. Envie em lote por e-mail ou copie links.', tip: 'Ações em lote mostram falhas parciais por convite.' },
      { title: 'Analisar respostas', description: 'Dashboard NPS com promotores/neutros/detratores por segmento.' },
    ],
    sections: [{ heading: 'Guardrails', paragraphs: ['Segmente análises; NPS agregado esconde variação — sempre compare cortes.'] }],
    faq: [{ q: 'Convite não chegou?', a: 'Confira status no lote; reenvie ou copie link manualmente.' }],
    troubleshooting: [{ problem: 'Gerar convites inativo', solution: 'Crie ao menos uma campanha antes.' }],
    screenshots: commonScreens(['Campanha nova', 'Lote de convites', 'Dashboard NPS']),
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
    slug: 'admin-usuarios',
    title: 'Usuários & Permissões',
    category: 'Administração',
    icon: Users,
    short: 'Cadastro de usuários, papéis (RBAC) e permissões granulares.',
    overview: ['Gestão de usuários com papéis (admin, manager, operator, viewer + verticais) e permissões por recurso/ação.'],
    routes: [{ label: 'Usuários', path: '/admin/usuarios' }],
    personas: ['Administrador'],
    prerequisites: ['Empresa configurada'],
    steps: [
      { title: 'Convidar usuário', description: 'Usuários → Novo → e-mail + papel inicial.' },
      { title: 'Atribuir permissões', description: 'Papéis já vêm com permissões padrão; ajuste granular por usuário se necessário.' },
      { title: 'Auditar mudanças', description: 'Toda alteração de papel é logada em system_audit_logs.' },
    ],
    sections: [{ heading: 'Segurança', paragraphs: ['Papéis nunca são armazenados no profile — sempre em user_roles com função has_role(). Nunca conceda admin sem MFA.'] }],
    faq: [{ q: 'Usuário não vê módulo?', a: 'Cheque papel e se o módulo está no plano contratado.' }],
    troubleshooting: [{ problem: 'Convite não recebido', solution: 'Reenvie e valide spam/domínio de e-mail.' }],
    screenshots: commonScreens(['Lista de usuários', 'Editor de papel']),
  },
  {
    slug: 'admin-empresas',
    title: 'Empresas & Filiais',
    category: 'Administração',
    icon: Building2,
    short: 'Multi-empresa, filiais, regime tributário e dados fiscais.',
    overview: ['Gerencie matriz e filiais com dados fiscais, regime e endereços.'],
    routes: [{ label: 'Empresas', path: '/admin/empresas' }],
    personas: ['Administrador', 'Fiscal'],
    prerequisites: [],
    steps: [
      { title: 'Cadastrar matriz', description: 'Empresas → Nova → CNPJ (autofill BrasilAPI).' },
      { title: 'Adicionar filiais', description: 'Vincule à matriz; cada filial pode ter regime próprio.' },
      { title: 'Ativar/inativar', description: 'Inativar bloqueia lançamentos mas preserva histórico.' },
    ],
    sections: [],
    faq: [{ q: 'Trocar de empresa?', a: 'Use o seletor no topo (multi-tenant).' }],
    troubleshooting: [{ problem: 'CNPJ inválido', solution: 'Confirme dígitos verificadores; consulte Receita.' }],
    screenshots: commonScreens(['Lista de empresas', 'Ficha da empresa']),
  },
  {
    slug: 'admin-parametros',
    title: 'Parâmetros do Sistema',
    category: 'Administração',
    icon: Settings,
    short: 'Configurações por categoria: fiscal, comercial, financeiro, WMS, integrações.',
    overview: ['Parâmetros globais e por empresa que ajustam comportamento sem código.'],
    routes: [{ label: 'Parâmetros', path: '/admin/parametros' }],
    personas: ['Administrador'],
    prerequisites: [],
    steps: [
      { title: 'Filtrar por categoria', description: 'Escolha Fiscal, Financeiro, etc.' },
      { title: 'Editar valor', description: 'Alterações sensíveis exigem confirmação e ficam auditadas.' },
    ],
    sections: [],
    faq: [{ q: 'Onde altero e-mail padrão?', a: 'Categoria Integrações → parâmetros de e-mail.' }],
    troubleshooting: [{ problem: 'Parâmetro não aplica', solution: 'Alguns exigem re-login para atualizar cache.' }],
    screenshots: commonScreens(['Lista de parâmetros', 'Edição']),
  },
  {
    slug: 'admin-seguranca',
    title: 'Segurança & Auditoria',
    category: 'Administração',
    icon: ShieldCheck,
    short: 'Auditoria cross-módulo, eventos críticos e scan de segurança.',
    overview: ['Trilha completa de eventos críticos (DELETE, ROLE_CHANGE, LOGIN_FAILED, EXPORT) e revisão contínua.'],
    routes: [
      { label: 'Auditoria', path: '/admin/auditoria' },
      { label: 'Auditoria Segurança', path: '/admin/seguranca/auditoria' },
    ],
    personas: ['Administrador', 'Compliance'],
    prerequisites: [],
    steps: [
      { title: 'Filtrar eventos', description: 'Por módulo, ação, usuário, período.' },
      { title: 'Investigar', description: 'Compare old_data vs new_data para reconstituir alterações.' },
      { title: 'Exportar', description: 'Gere relatório para compliance/auditoria externa.' },
    ],
    sections: [{ heading: 'Boas práticas', paragraphs: ['Revise semanalmente eventos ROLE_CHANGE e DELETE.'] }],
    faq: [{ q: 'Faltam eventos?', a: 'Confirme triggers ativos e RLS de leitura.' }],
    troubleshooting: [{ problem: 'Export bloqueado', solution: 'Requer papel admin + confirmação.' }],
    screenshots: commonScreens(['Trilha de auditoria', 'Detalhe de evento']),
  },
  {
    slug: 'billing',
    title: 'Billing & Uso',
    category: 'Administração',
    icon: CreditCard,
    short: 'Plano contratado, medidores de uso e upgrades.',
    overview: ['Acompanhe consumo por medidor (usuários, NF-e, ordens, IA) e faça upgrade quando necessário.'],
    routes: [
      { label: 'Uso', path: '/billing/uso' },
      { label: 'Upgrade', path: '/upgrade' },
    ],
    personas: ['Administrador', 'Diretor'],
    prerequisites: [],
    steps: [
      { title: 'Ver consumo', description: 'Uso mostra % de cada medidor no mês.' },
      { title: 'Upgrade', description: 'Escolha plano superior; efeito imediato.' },
    ],
    sections: [],
    faq: [{ q: 'Bloqueio por limite?', a: 'Sistema alerta em 80% e bloqueia em 100% — planeje upgrade antes.' }],
    troubleshooting: [{ problem: 'Fatura não bate', solution: 'Contate suporte com número da fatura.' }],
    screenshots: commonScreens(['Medidores', 'Planos']),
  },
  {
    slug: 'rfid',
    title: 'RFID',
    category: 'Operacional',
    icon: Radio,
    short: 'Leitores, tags e eventos em tempo real integrados ao WMS.',
    overview: ['Rastreamento por RFID com eventos realtime que alimentam WMS e inventário.'],
    routes: [
      { label: 'Leitores', path: '/rfid/leitores' },
      { label: 'Tags', path: '/rfid/tags' },
      { label: 'Eventos', path: '/rfid/eventos' },
    ],
    personas: ['Logística', 'TI'],
    prerequisites: ['Hardware RFID configurado'],
    steps: [
      { title: 'Cadastrar leitor', description: 'Informe endereço IP e localização.' },
      { title: 'Vincular tag ao produto', description: 'Uma tag = um item rastreável.' },
      { title: 'Monitorar eventos', description: 'Feed realtime; anomalias geram alerta.' },
    ],
    sections: [],
    faq: [{ q: 'Leitor offline?', a: 'Verifique rede e status do gateway.' }],
    troubleshooting: [{ problem: 'Tag não lida', solution: 'Confirme distância e obstrução metálica.' }],
    screenshots: commonScreens(['Feed de eventos', 'Lista de leitores']),
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

export const MANUAL_CATEGORIES: Record<ModuleManual['category'], { color: string; description: string }> = {
  Operacional: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', description: 'Módulos do dia a dia da operação' },
  Financeiro: { color: 'bg-green-500/10 text-green-500 border-green-500/30', description: 'Controle financeiro e contábil' },
  Fiscal: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', description: 'Documentos e obrigações fiscais' },
  Estratégico: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/30', description: 'Visão executiva e IA' },
  Administração: { color: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/30', description: 'Configuração e segurança' },
  Relacionamento: { color: 'bg-pink-500/10 text-pink-500 border-pink-500/30', description: 'CX, NPS e pós-venda' },
};

// ============================================================================
// Conteúdo "Para leigos" — linguagem simples, analogias do dia a dia
// ============================================================================

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

const GENERIC_GLOSSARY: BeginnerContent['glossary'] = [
  { term: 'KPI', definition: 'Indicador-chave: um número que mostra se algo vai bem ou mal (ex.: vendas do dia).' },
  { term: 'Dashboard', definition: 'Painel com vários indicadores juntos, como o painel de um carro.' },
  { term: 'Workflow', definition: 'Fluxo de trabalho automático — o sistema empurra a tarefa para a pessoa certa.' },
  { term: 'RLS', definition: 'Regra invisível que garante que você só vê os dados da sua empresa.' },
];

export const MODULE_BEGINNER: Record<string, BeginnerContent> = {
  dashboard: {
    inPlainWords: 'A tela principal que mostra, em um piscar de olhos, se sua empresa está bem hoje.',
    analogy: 'É como o painel do carro: mostra velocidade, combustível e alertas — você não precisa abrir o capô para saber se está tudo certo.',
    plainSteps: [
      'Faça login. O painel abre sozinho — não é preciso configurar nada no primeiro uso.',
      'Olhe as cores dos cartões: verde é bom, amarelo pede atenção, vermelho precisa de ação.',
      'Clique em qualquer cartão para ver os detalhes (chamamos isso de "drill-down").',
      'Se algo estiver zerado, cheque no topo se você selecionou a empresa certa.',
    ],
    glossary: [
      { term: 'Drill-down', definition: 'Clicar em um número para descobrir de onde ele veio.' },
      { term: 'Command Palette', definition: 'Atalho Ctrl+K que abre uma busca rápida para pular para qualquer tela.' },
      ...GENERIC_GLOSSARY.slice(0, 2),
    ],
    timeToLearn: '5 minutos',
  },
  comercial: {
    inPlainWords: 'Onde você cadastra clientes, cria pedidos de venda e acompanha o funil comercial.',
    analogy: 'Pense em um caderno de pedidos digital que, sozinho, calcula impostos, reserva estoque e envia a nota fiscal.',
    plainSteps: [
      'Cadastre o cliente uma vez (digite só o CNPJ, o resto o sistema busca).',
      'Crie um pedido: escolha o cliente, adicione os produtos e revise.',
      'Arraste o pedido no Kanban conforme ele evolui (Proposta → Fechado → Faturado).',
      'Quando fechar, o sistema emite a nota fiscal e lança a cobrança sozinho.',
    ],
    glossary: [
      { term: 'Pipeline / Kanban', definition: 'Quadro visual com colunas onde cada cartão é um pedido em andamento.' },
      { term: 'NF-e', definition: 'Nota fiscal eletrônica — o documento oficial da venda.' },
      { term: 'Churn', definition: 'Cliente que parou de comprar. A IA avisa antes que aconteça.' },
    ],
    timeToLearn: '30 minutos',
  },
  financeiro: {
    inPlainWords: 'Controla o dinheiro que entra e sai da empresa e mostra quanto sobra no fim do mês.',
    analogy: 'É a versão profissional do seu app de banco pessoal, com contas a pagar, contas a receber e conciliação automática.',
    plainSteps: [
      'Cadastre suas contas bancárias uma vez.',
      'Lance contas a pagar assim que a nota chegar (ou deixe o sistema criar sozinho a partir de compras).',
      'Uma vez por semana, importe o extrato do banco (.OFX). O sistema "casa" os lançamentos sozinho.',
      'Consulte a Tesouraria para saber quanto você terá em caixa nos próximos 30 dias.',
    ],
    glossary: [
      { term: 'AP (Contas a Pagar)', definition: 'Tudo que você deve pagar: fornecedores, aluguel, impostos.' },
      { term: 'AR (Contas a Receber)', definition: 'Tudo que vão te pagar: vendas a prazo, boletos emitidos.' },
      { term: 'Conciliação', definition: 'Comparar o extrato do banco com o que está no sistema para achar diferenças.' },
      { term: 'DRE', definition: 'Relatório que mostra se você teve lucro ou prejuízo no período.' },
    ],
    timeToLearn: '1 hora',
  },
  fiscal: {
    inPlainWords: 'Cuida das notas fiscais e das obrigações que sua empresa precisa entregar ao governo.',
    analogy: 'É como um contador digital que preenche e envia os documentos oficiais para você, sem erros de conta.',
    plainSteps: [
      'Suba o certificado digital A1 (arquivo .pfx que sua contabilidade te enviou).',
      'Configure uma vez as regras de imposto por estado — o sistema aplica sozinho depois.',
      'Toda venda vira NF-e automaticamente; você só revisa e confirma.',
      'No fim do mês, gere o SPED e envie ao contador.',
    ],
    glossary: [
      { term: 'Certificado A1', definition: 'Um arquivo que funciona como sua assinatura digital para o governo.' },
      { term: 'CFOP', definition: 'Código que diz "o que" está sendo feito com a mercadoria (venda, devolução, brinde).' },
      { term: 'SPED', definition: 'Arquivo digital que você entrega mensalmente à Receita.' },
      { term: 'ICMS / PIS / COFINS', definition: 'Impostos que incidem sobre a venda. O sistema calcula pra você.' },
    ],
    timeToLearn: '2 horas com apoio do contador',
  },
  producao: {
    inPlainWords: 'Planeja e acompanha a fabricação: o que produzir, quando, com quais materiais.',
    analogy: 'É a receita de bolo somada à agenda da cozinha: sabe o que tem no armário e quando ligar o forno.',
    plainSteps: [
      'Cadastre a "receita" de cada produto (BOM: quais insumos e quantidades).',
      'Rode o MRP: o sistema calcula o que falta comprar e o que produzir.',
      'Abra uma Ordem de Produção e imprima para o chão de fábrica.',
      'Operador aponta início, fim e quantidade no terminal ou coletor.',
    ],
    glossary: [
      { term: 'BOM', definition: 'Lista de ingredientes de um produto (Bill of Materials).' },
      { term: 'MRP', definition: 'Cálculo automático do que precisa ser comprado e produzido para atender pedidos.' },
      { term: 'OEE', definition: 'Nota de 0 a 100 que diz o quão eficiente sua fábrica está.' },
      { term: 'Apontamento', definition: 'Registro que o operador faz no chão de fábrica dizendo "comecei/terminei".' },
    ],
    timeToLearn: '3 horas',
  },
  wms: {
    inPlainWords: 'Organiza o armazém: recebe mercadoria, guarda em endereços e separa para expedição.',
    analogy: 'É o GPS da sua loja de trás: cada item tem um "endereço" e o sistema fala pro operador onde ir.',
    plainSteps: [
      'Ao chegar mercadoria, escaneie a nota — o sistema confere quantidades.',
      'Deixe o sistema sugerir o endereço de armazenagem (put-away).',
      'Ao receber pedidos, gere uma "onda" de picking — o coletor guia o operador.',
      'Após conferir, gere o manifesto de saída.',
    ],
    glossary: [
      { term: 'Put-away', definition: 'Guardar a mercadoria no lugar certo depois de receber.' },
      { term: 'Picking', definition: 'Separar os produtos de um pedido no armazém.' },
      { term: 'Onda', definition: 'Um grupo de pedidos separado junto para economizar caminhadas.' },
      { term: 'Coletor', definition: 'Aparelho de mão com leitor de código de barras que o operador usa.' },
    ],
    timeToLearn: '2 horas',
  },
  compras: {
    inPlainWords: 'Onde a empresa pede orçamentos, aprova e emite pedidos de compra para fornecedores.',
    analogy: 'Como um WhatsApp organizado com seus fornecedores: você pede preço, compara e aprova por dentro do sistema.',
    plainSteps: [
      'Crie uma requisição dizendo o que precisa.',
      'Envie a cotação para 2 ou 3 fornecedores.',
      'Compare preço, prazo e frete lado a lado.',
      'Aprovador recebe no Workflow Inbox e aprova em um clique.',
    ],
    glossary: [
      { term: 'PO', definition: 'Pedido de Compra: documento oficial enviado ao fornecedor.' },
      { term: 'Alçada', definition: 'Valor máximo que cada pessoa pode aprovar sozinha.' },
      { term: 'Cotação', definition: 'Pedir preço a vários fornecedores antes de decidir.' },
    ],
    timeToLearn: '30 minutos',
  },
  estoque: {
    inPlainWords: 'Mostra o que você tem, o que está vendendo bem e o que está parado.',
    analogy: 'É o inventário da despensa: você sabe o que tem, quanto vale e o que precisa repor.',
    plainSteps: [
      'Cadastre seus produtos com SKU, unidade e categoria.',
      'Consulte o Kardex para ver toda entrada/saída de um item.',
      'Use a Curva ABC para focar nos itens que mais faturam.',
    ],
    glossary: [
      { term: 'SKU', definition: 'Código único do produto no seu sistema.' },
      { term: 'Kardex', definition: 'Extrato de movimentações de um produto (parecido com extrato bancário).' },
      { term: 'Curva ABC', definition: 'Regra 80/20: A = os poucos que mais faturam, C = os muitos de baixo giro.' },
    ],
    timeToLearn: '20 minutos',
  },
  contabilidade: {
    inPlainWords: 'Registra oficialmente cada movimento financeiro para gerar balanço e DRE.',
    analogy: 'É o "diário oficial" da empresa. Cada operação vira uma partida dobrada, como débito e crédito no banco.',
    plainSteps: [
      'Importe (ou use o padrão) seu Plano de Contas.',
      'Deixe o sistema criar os lançamentos automáticos das vendas, compras e folha.',
      'Revise diariamente as divergências.',
      'No fim do mês, feche o período — depois disso ninguém edita mais.',
    ],
    glossary: [
      { term: 'Plano de Contas', definition: 'Lista de "gavetas" onde cada centavo é classificado.' },
      { term: 'Partida Dobrada', definition: 'Todo lançamento tem 2 lados: origem e destino do dinheiro.' },
      { term: 'Balancete', definition: 'Foto do saldo de todas as contas em um dia.' },
    ],
    timeToLearn: '4 horas com contador',
  },
  tms: {
    inPlainWords: 'Planeja rotas de entrega, cadastra frota e acompanha os motoristas em tempo real.',
    analogy: 'É o Waze da sua expedição: monta a melhor rota e mostra onde cada motorista está agora.',
    plainSteps: [
      'Cadastre veículos e motoristas.',
      'Selecione pedidos prontos e clique em "otimizar rota".',
      'Envie o manifesto para o motorista via app.',
      'Acompanhe o rastreamento ao vivo e receba o comprovante (foto) quando entregar.',
    ],
    glossary: [
      { term: 'POD', definition: 'Prova de entrega — foto ou assinatura do recebedor.' },
      { term: 'Manifesto', definition: 'Documento com todas as entregas que o motorista vai fazer no dia.' },
      { term: 'Live Tracking', definition: 'Ver a localização do motorista em tempo real no mapa.' },
    ],
    timeToLearn: '1 hora',
  },
  'crm-nps': {
    inPlainWords: 'Envia pesquisas curtas aos clientes para saber se estão satisfeitos.',
    analogy: 'Aquela perguntinha "de 0 a 10, quanto você recomendaria?" — agora automática por e-mail.',
    plainSteps: [
      'Crie uma campanha definindo o público e o canal.',
      'Gere os convites em lote — cada cliente recebe um link único.',
      'Aguarde as respostas caírem no dashboard.',
      'Ligue para os detratores (nota 0–6) para reverter insatisfação.',
    ],
    glossary: [
      { term: 'NPS', definition: 'Nota de 0 a 10 que mede o quanto o cliente recomendaria sua empresa.' },
      { term: 'Promotor', definition: 'Nota 9 ou 10 — cliente feliz que indica.' },
      { term: 'Detrator', definition: 'Nota 0 a 6 — cliente insatisfeito que precisa de atenção.' },
    ],
    timeToLearn: '15 minutos',
  },
  executivo: {
    inPlainWords: 'Uma IA que responde perguntas sobre a empresa e pode executar ações no ERP para você.',
    analogy: 'É como ter um analista disponível 24h: pergunte em português e ele consulta os dados reais e responde.',
    plainSteps: [
      'Abra o Cérebro e digite perguntas como você faria a um colega.',
      'Peça análises: "compare minhas vendas deste mês com o anterior".',
      'Se ele sugerir uma ação (ex.: enviar cobrança), confirme antes de executar.',
      'Se errar, corrija no Learning — ele aprende com o feedback.',
    ],
    glossary: [
      { term: 'Tool Calling', definition: 'Quando a IA executa uma ação de verdade no sistema (não só conversa).' },
      { term: 'Guardrails', definition: 'Barreiras de segurança que exigem sua confirmação em ações críticas.' },
      { term: 'Autopilot', definition: 'Rotinas automáticas diárias (ex.: relatório às 7h no WhatsApp).' },
    ],
    timeToLearn: '10 minutos',
  },
  'admin-usuarios': {
    inPlainWords: 'Convida colaboradores e define o que cada um pode ver e fazer.',
    analogy: 'É o controle de chaves da empresa: você decide quem entra em quais salas.',
    plainSteps: [
      'Convide o usuário por e-mail.',
      'Escolha o papel inicial (admin, gerente, operador, viewer).',
      'Se quiser, ajuste permissões específicas por tela.',
      'Acompanhe mudanças na auditoria — toda alteração fica registrada.',
    ],
    glossary: [
      { term: 'RBAC', definition: 'Sistema de permissões baseado em papéis (ex.: "todo Gerente pode X").' },
      { term: 'Papel / Role', definition: 'Um conjunto pronto de permissões (admin, manager, viewer).' },
      { term: 'MFA', definition: 'Segundo fator de autenticação (código no celular além da senha).' },
    ],
    timeToLearn: '20 minutos',
  },
  'admin-empresas': {
    inPlainWords: 'Cadastra a matriz e as filiais da sua empresa (multi-CNPJ).',
    analogy: 'Uma "árvore genealógica" da sua empresa: matriz no topo e filiais penduradas.',
    plainSteps: [
      'Cadastre a matriz digitando só o CNPJ.',
      'Adicione filiais vinculadas à matriz.',
      'Use o seletor no topo do sistema para alternar entre empresas.',
    ],
    glossary: [
      { term: 'Multi-tenant', definition: 'Vários CNPJs no mesmo sistema, cada um com seus próprios dados.' },
      { term: 'Filial', definition: 'Unidade que depende de uma matriz mas pode ter regime próprio.' },
    ],
    timeToLearn: '15 minutos',
  },
  'admin-parametros': {
    inPlainWords: 'Ajusta o comportamento do sistema sem precisar de programador.',
    analogy: 'É o "menu de configurações" do sistema, como as configurações do seu celular.',
    plainSteps: [
      'Escolha uma categoria (Fiscal, Financeiro, WMS…).',
      'Encontre o parâmetro que quer ajustar.',
      'Salve. Algumas mudanças pedem re-login para valer.',
    ],
    glossary: [
      { term: 'Parâmetro', definition: 'Uma configuração salva que muda como o sistema se comporta.' },
    ],
    timeToLearn: '10 minutos',
  },
  'admin-seguranca': {
    inPlainWords: 'Mostra tudo que aconteceu de importante no sistema: quem fez o quê e quando.',
    analogy: 'Uma câmera de segurança digital: grava as ações críticas para você conferir depois.',
    plainSteps: [
      'Filtre por período, usuário ou tipo de ação.',
      'Ao clicar em um evento, compare "antes" e "depois".',
      'Exporte para auditoria externa quando pedirem.',
    ],
    glossary: [
      { term: 'Audit Log', definition: 'Registro imutável de uma ação (não pode ser apagado).' },
      { term: 'ROLE_CHANGE', definition: 'Evento de mudança de papel de um usuário — sempre revise.' },
    ],
    timeToLearn: '20 minutos',
  },
  billing: {
    inPlainWords: 'Mostra o quanto do seu plano você já usou e como fazer upgrade.',
    analogy: 'É como a tela de "dados do celular": mostra quanto você já consumiu no mês.',
    plainSteps: [
      'Veja o consumo por medidor (usuários, NF-e, IA...).',
      'Se chegar em 80%, o sistema avisa.',
      'Clique em "Upgrade" para subir de plano imediatamente.',
    ],
    glossary: [
      { term: 'Medidor', definition: 'Uma métrica que o plano limita (ex.: 1000 NF-e/mês).' },
    ],
    timeToLearn: '5 minutos',
  },
  rfid: {
    inPlainWords: 'Rastreia produtos por etiquetas de rádio-frequência, sem precisar bipar um por um.',
    analogy: 'É o pedágio automático da sua loja: a etiqueta passa perto do leitor e ele já contabiliza.',
    plainSteps: [
      'Cadastre o leitor (IP + localização).',
      'Cole uma tag RFID em cada produto rastreável.',
      'Acompanhe eventos em tempo real no feed.',
    ],
    glossary: [
      { term: 'Tag RFID', definition: 'Etiqueta pequena com um chip que emite sinal de rádio.' },
      { term: 'Leitor', definition: 'Antena que capta as tags que passam perto.' },
    ],
    timeToLearn: '1 hora',
  },
  relatorios: {
    inPlainWords: 'Relatórios prontos, com filtros, que podem ser exportados em PDF ou Excel.',
    analogy: 'É o "cardápio de relatórios": escolhe o que quer ver, aplica os filtros e imprime.',
    plainSteps: [
      'Escolha o relatório no menu.',
      'Aplique filtros (período, empresa, categoria).',
      'Clique em Exportar (PDF para apresentar, Excel para analisar).',
    ],
    glossary: [
      { term: 'Filtro', definition: 'Restrição que reduz o relatório ao que você quer ver.' },
    ],
    timeToLearn: '10 minutos',
  },
};

const FALLBACK_BEGINNER: BeginnerContent = {
  inPlainWords: 'Este módulo faz parte do ERP e trabalha integrado aos demais para automatizar processos.',
  analogy: 'Pense nele como uma peça de um quebra-cabeça: sozinho já ajuda, mas junto com os outros módulos fica poderoso.',
  plainSteps: [
    'Explore a tela principal e clique em cada botão sem medo — mudanças pedem confirmação.',
    'Consulte a aba "Passo a passo" para o fluxo padrão de uso.',
    'Se algo não funcionar, veja a aba "Problemas" antes de abrir chamado.',
  ],
  glossary: GENERIC_GLOSSARY,
  timeToLearn: '30 minutos',
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
