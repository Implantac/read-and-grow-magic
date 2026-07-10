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
