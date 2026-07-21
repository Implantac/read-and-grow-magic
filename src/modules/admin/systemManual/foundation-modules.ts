import type { BusinessRule, ModuleFoundation } from './foundation-types';

const R = (rule: string, reason: string, severity: BusinessRule['severity'] = 'warning'): BusinessRule => ({ rule, reason, severity });

export const MODULE_FOUNDATION: Record<string, ModuleFoundation> = {
  dashboard: {
    concept: 'O Dashboard não é um relatório: é um instrumento de decisão em tempo real. Cada cartão precisa ter dono, meta e ação esperada quando fica vermelho.',
    businessRules: [
      R('KPI sem meta configurada não deve exibir semáforo colorido.', 'Semáforo sem meta gera falso senso de urgência ou de conforto.', 'warning'),
      R('Todo alerta crítico precisa ter um responsável designado.', 'Alerta sem dono é alerta ignorado.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Tempo médio de resposta a alerta crítico', formula: 'média(t_ack - t_criado) em alertas críticos', target: '< 30 min em horário comercial' },
      { name: 'KPIs com meta ativa', formula: 'kpis_com_meta / kpis_total', target: '> 90%' },
    ],
    routines: [
      { when: 'Diariamente 08:30', action: 'Revisar cartões vermelhos e delegar ação.', responsible: 'Diretor / Gerente de área' },
      { when: 'Semanalmente segunda 09:00', action: 'Recalibrar metas se semáforo estiver sempre verde ou sempre vermelho.', responsible: 'Sponsor' },
    ],
    integrations: [
      { with: 'Todos os módulos', what: 'Consome KPIs consolidados; sem lançamento nos módulos, cartões ficam zerados.' },
      { with: 'IA Executiva', what: 'Cérebro pode responder "por que este KPI caiu?" com drill-down automático.' },
    ],
    antipatterns: [
      'Criar 40 cartões: ninguém olha. Máximo 8-12 por perfil.',
      'Deixar cartão sem clique/drill-down — vira decoração.',
    ],
  },
  comercial: {
    concept: 'Comercial é o motor de receita. Todo pedido percorre um fluxo O2C (order-to-cash) auditável e sem atalhos: cadastro → cotação → pedido → separação → NF-e → AR → recebimento.',
    businessRules: [
      R('Cliente bloqueado por crédito não pode gerar pedido faturado sem aprovação explícita.', 'Evita inadimplência estrutural.', 'blocking'),
      R('Desconto acima da alçada abre workflow — vendedor não confirma sozinho.', 'Protege margem e cria trilha de auditoria.', 'blocking'),
      R('Reserva de estoque acontece no momento do pedido confirmado, não na proposta.', 'Reserva na proposta paralisa estoque em oportunidades incertas.', 'warning'),
      R('CFOP é sugerido pelo motor fiscal; alteração manual exige justificativa.', 'CFOP errado gera rejeição SEFAZ e retrabalho.', 'warning'),
      R('Cancelamento de NF-e só é permitido dentro do prazo legal (24h para NF-e; 30 min para NFC-e).', 'Fora do prazo, único caminho é NF-e de devolução.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Ciclo O2C', formula: 'média(dt_faturamento - dt_pedido)', target: '< 48h para venda padrão' },
      { name: 'Taxa de conversão do pipeline', formula: 'pedidos_ganhos / oportunidades_abertas', target: '> 25%' },
      { name: 'Ticket médio', formula: 'faturamento_periodo / pedidos_faturados', target: 'Monitorar tendência' },
      { name: 'Margem estimada média', formula: 'média(margem_estimada_pedido)', target: 'Definir por segmento' },
    ],
    routines: [
      { when: 'Diariamente 09:00', action: 'Rodar Vendas 360°, tratar alertas comerciais abertos.', responsible: 'Gerente comercial' },
      { when: 'Diariamente 18:00', action: 'Fechar pedidos do dia; empurrar para faturamento os que estão prontos.', responsible: 'Vendedor / Backoffice' },
      { when: 'Semanalmente', action: 'Revisão de forecast vs. realizado, ajuste de metas por vendedor.', responsible: 'Gerente comercial' },
    ],
    integrations: [
      { with: 'Estoque', what: 'Reserva ao confirmar pedido; baixa ao faturar.' },
      { with: 'Fiscal', what: 'Faturamento gera NF-e via motor tributário.' },
      { with: 'Financeiro', what: 'NF-e autorizada gera AR automaticamente com vencimentos.' },
      { with: 'Crédito', what: 'Bloqueia pedido para cliente inadimplente ou fora da alçada de crédito.' },
    ],
    antipatterns: [
      'Cadastrar cliente sem CNPJ — impede autofill fiscal e trava NF-e.',
      'Usar campos "obs" para gravar regra de negócio — regra vira parâmetro, não texto.',
      'Ignorar alertas do módulo — cada alerta corresponde a receita em risco.',
    ],
  },
  financeiro: {
    concept: 'Financeiro é o coração de caixa: garante que toda operação vira lançamento e todo lançamento é reconciliado com o mundo real (extrato bancário) todo dia.',
    businessRules: [
      R('Todo AP acima da alçada exige aprovação antes do pagamento.', 'Impede pagamento indevido.', 'blocking'),
      R('Baixa de AP/AR fora do banco correspondente é bloqueada.', 'Preserva conciliação.', 'blocking'),
      R('Estorno de baixa exige justificativa e fica auditado.', 'Estorno é ponto histórico de fraude.', 'blocking'),
      R('DRE só é definitiva após fechamento contábil do período.', 'Ajustes retroativos distorcem análise.', 'warning'),
      R('Lançamentos em período fechado são bloqueados; a única saída é abrir o período.', 'Integridade contábil.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Prazo médio de recebimento (PMR)', formula: 'saldo_AR / receita_media_diaria', target: 'Definir por segmento; menor = melhor liquidez' },
      { name: 'Prazo médio de pagamento (PMP)', formula: 'saldo_AP / compras_media_diaria', target: 'Alinhado ao PMR' },
      { name: 'Divergência de conciliação', formula: 'lançamentos_manuais / total_lançamentos', target: '< 5%' },
      { name: 'Fluxo de caixa 30d', formula: 'entradas_previstas - saídas_previstas', target: 'Sempre positivo' },
    ],
    routines: [
      { when: 'Diariamente 08:30', action: 'Rodar conciliação bancária, tratar exceções.', responsible: 'Financeiro' },
      { when: 'Diariamente 17:00', action: 'Baixar AP em lote dos pagamentos do dia.', responsible: 'Financeiro' },
      { when: 'Semanalmente', action: 'Régua de cobrança para AR atrasado.', responsible: 'Financeiro / Crédito' },
      { when: 'Mensalmente D+5', action: 'Fechamento do período contábil.', responsible: 'Contábil' },
    ],
    integrations: [
      { with: 'Comercial', what: 'Recebe AR automático das NF-e emitidas.' },
      { with: 'Compras', what: 'Recebe AP automático dos POs recebidos.' },
      { with: 'Contabilidade', what: 'Gera partidas dobradas para cada movimento.' },
      { with: 'Bancos', what: 'Import OFX/CSV + Open Finance para conciliação diária.' },
    ],
    antipatterns: [
      'Fazer baixa manual em vez de conciliar — vira caixa paralelo.',
      'Deixar AP sem centro de custo — DRE gerencial vira inútil.',
      'Alterar valor de AR já emitido em NF-e — só devolução legaliza.',
    ],
  },
  fiscal: {
    concept: 'Fiscal é onde a operação encontra o Estado. Erro fiscal não é reversível: rejeição SEFAZ, autuação e multa são custos reais. O motor tributário calcula tudo — cabe ao operador revisar, não recalcular manualmente.',
    businessRules: [
      R('NF-e só pode ser emitida com certificado A1 válido dentro do prazo.', 'Certificado vencido = zero faturamento.', 'blocking'),
      R('Cancelamento de NF-e: até 24h após autorização (7 dias com justificativa em alguns estados).', 'Depois disso, único caminho legal é NF-e de devolução.', 'blocking'),
      R('CFOP tem que ser coerente com finalidade da operação e UF.', 'CFOP errado = rejeição SEFAZ e recolhimento indevido.', 'blocking'),
      R('ICMS-ST é calculado sobre MVA da UF de destino, não da origem.', 'Erro comum que gera passivo tributário.', 'blocking'),
      R('DIFAL para consumidor final não contribuinte é do vendedor.', 'Regra pós-EC 87/2015; falha gera autuação.', 'blocking'),
      R('SPED deve ser transmitido dentro dos prazos legais mensais.', 'Atraso = multa progressiva.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Taxa de rejeição SEFAZ', formula: 'nfe_rejeitadas / nfe_transmitidas', target: '< 2%' },
      { name: 'Tempo médio de emissão NF-e', formula: 'média(t_autorizada - t_gerada)', target: '< 5 s' },
      { name: 'Dias para vencimento do certificado', formula: 'expira_em - hoje', target: 'Sempre > 30 dias' },
    ],
    routines: [
      { when: 'Diariamente 09:00', action: 'Verificar rejeições SEFAZ e reprocessar.', responsible: 'Fiscal' },
      { when: 'Semanalmente', action: 'Auditar CFOPs mais usados vs. tipo de operação.', responsible: 'Fiscal / Contador' },
      { when: 'Mensalmente até D+15', action: 'Gerar e transmitir SPED Fiscal e Contribuições.', responsible: 'Fiscal / Contador' },
      { when: 'Anualmente / semestralmente', action: 'Renovar certificado digital A1 antes do vencimento.', responsible: 'TI / Fiscal' },
    ],
    integrations: [
      { with: 'Comercial', what: 'Emite NF-e para todo pedido faturado.' },
      { with: 'Compras', what: 'Importa XML de entrada de fornecedores.' },
      { with: 'Contabilidade', what: 'NF-e vira lançamento contábil automático.' },
      { with: 'Financeiro', what: 'NF-e autorizada gera AR/AP.' },
    ],
    antipatterns: [
      'Alterar alíquota "só desse pedido" no XML — quebra motor tributário.',
      'Ignorar rejeição 999 sem consultar sefaz_status_uf — pode ser instabilidade da SEFAZ, não erro seu.',
      'Emitir NF-e para "acertar" estoque — use ajuste de inventário auditado.',
    ],
  },
  producao: {
    concept: 'Produção é planejamento temporal: transformar demanda futura em ordens de compra e produção hoje. O MRP não substitui o julgamento humano — ele mostra o cenário, o PCP decide.',
    businessRules: [
      R('OP só pode iniciar com todos os componentes reservados.', 'Fura o plano e gera parada de linha.', 'blocking'),
      R('Apontamento de produção não pode retroagir mais de 24h sem aprovação.', 'Retroativo bagunça OEE e custo.', 'warning'),
      R('Refugo acima do padrão dispara ação corretiva automática.', 'Qualidade cai antes que o cliente perceba.', 'warning'),
      R('BOM só é alterada com controle de revisão; OPs em andamento seguem a BOM da abertura.', 'Rastreabilidade e custeio.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'OEE', formula: 'Disponibilidade × Performance × Qualidade', target: '> 65% (world class > 85%)' },
      { name: 'Aderência ao plano', formula: 'OPs_concluídas_no_prazo / OPs_planejadas', target: '> 90%' },
      { name: 'Refugo (%)', formula: 'qtd_refugada / qtd_produzida', target: 'Definir por linha' },
      { name: 'Lead time de produção', formula: 'média(t_conclusão - t_abertura)', target: 'Reduzir mês a mês' },
    ],
    routines: [
      { when: 'Semanalmente segunda 07:00', action: 'Rodar MRP e travar ordens de compra sugeridas.', responsible: 'PCP' },
      { when: 'Diariamente 07:00', action: 'Emitir OPs do dia; conferir disponibilidade de material.', responsible: 'PCP' },
      { when: 'Continuamente', action: 'Apontamento em tempo real por operador no terminal/coletor.', responsible: 'Operador de produção' },
    ],
    integrations: [
      { with: 'Estoque', what: 'Consome componentes e alimenta produto acabado.' },
      { with: 'Compras', what: 'MRP sugere OCs para itens abaixo do ponto de pedido.' },
      { with: 'Contabilidade', what: 'Custeio de OP encerrada gera lançamento de CPV.' },
    ],
    antipatterns: [
      'Rodar MRP com previsão de vendas defasada — gera compra errada.',
      'Fechar OP sem apontar refugo — custo real vira ficção.',
    ],
  },
  wms: {
    concept: 'WMS é sobre economia de passos e precisão de saldo. Cada item tem um endereço. Cada movimento vira evento. Sem endereço, sem WMS.',
    businessRules: [
      R('Recebimento cego (blind receiving) é opção, mas conferência divergente exige tratamento.', 'Evita "carimbar" tudo como OK e mascarar divergência.', 'warning'),
      R('Onda de picking respeita a curva ABC e a distância entre endereços.', 'Reduz tempo de separação.', 'info'),
      R('Ajuste de inventário sempre gera trilha auditável com aprovador.', 'Ajuste é vetor comum de fraude.', 'blocking'),
      R('Endereço bloqueado (bloqueio de qualidade) não pode ser alocado em picking.', 'Impede envio de item em quarentena.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Acuracidade de inventário', formula: 'saldos_corretos / saldos_totais', target: '> 98%' },
      { name: 'Produtividade de picking', formula: 'linhas_picadas / hora × operador', target: 'Baseline + 10% ano' },
      { name: 'Lead time de recebimento', formula: 'média(t_endereçado - t_recebido)', target: '< 4h' },
    ],
    routines: [
      { when: 'Diariamente', action: 'Inventário rotativo cíclico por endereço.', responsible: 'Logística' },
      { when: 'Por onda', action: 'Gerar onda de picking agrupando pedidos da mesma região.', responsible: 'Coordenador WMS' },
      { when: 'Ao chegar carga', action: 'Conferência + put-away assistido.', responsible: 'Operador de recebimento' },
    ],
    integrations: [
      { with: 'Comercial', what: 'Recebe pedidos para separação.' },
      { with: 'TMS', what: 'Manifesto de saída vira carga a expedir.' },
      { with: 'RFID', what: 'Eventos realtime alimentam saldos e localização.' },
    ],
    antipatterns: [
      'Trabalhar sem endereço definido — o WMS deixa de ser WMS.',
      'Aceitar recebimento sem conferir — divergência migra para o cliente final.',
    ],
  },
  compras: {
    concept: 'Compras protege margem antes que ela exista: escolher fornecedor certo, no preço certo, no prazo certo. Alçadas são inegociáveis.',
    businessRules: [
      R('Toda cotação exige no mínimo 3 fornecedores acima de determinado valor.', 'Evita direcionamento e conflito de interesse.', 'warning'),
      R('PO só é emitido depois de aprovado dentro da alçada.', 'Compra fora da alçada é passivo trabalhista/fiscal potencial.', 'blocking'),
      R('Fornecedor exige homologação antes do primeiro PO.', 'Reduz risco reputacional/fiscal.', 'warning'),
      R('Recebimento diverge do PO em mais de X% → bloqueio para aceite.', 'Evita distorção de custo.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Saving por cotação', formula: '(preço_pior - preço_escolhido) / preço_pior', target: '> 5%' },
      { name: 'OTIF (On Time In Full)', formula: 'entregas_ok / entregas_totais', target: '> 90%' },
      { name: 'Ciclo P2P (procure-to-pay)', formula: 'média(t_pagamento - t_requisição)', target: 'Alinhado a PMP' },
    ],
    routines: [
      { when: 'Diariamente', action: 'Rodar Workflow Inbox e liberar POs pendentes.', responsible: 'Aprovador' },
      { when: 'Semanalmente', action: 'Consolidar requisições e emitir cotações.', responsible: 'Compras' },
      { when: 'Mensalmente', action: 'Avaliar fornecedores (OTIF, preço, qualidade).', responsible: 'Compras' },
    ],
    integrations: [
      { with: 'Estoque / WMS', what: 'Recebimento entra pelo PO.' },
      { with: 'Financeiro', what: 'PO recebido vira AP.' },
      { with: 'Produção', what: 'MRP alimenta requisições automáticas.' },
    ],
    antipatterns: [
      'Emitir PO sem cotação — abre porta para fraude.',
      'Aceitar diferença de preço no recebimento sem justificar — some centavo a centavo até virar prejuízo.',
    ],
  },
  estoque: {
    concept: 'Estoque bem gerido = capital de giro liberado. Cada SKU cadastrado errado vira erro em cascata nos outros módulos.',
    businessRules: [
      R('Não excluir produto com movimentação — apenas inativar.', 'Preserva histórico e rastreabilidade fiscal.', 'blocking'),
      R('SKU e NCM são obrigatórios para emitir NF-e.', 'Sem NCM, motor tributário não calcula.', 'blocking'),
      R('Toda saída/entrada gera lançamento no Kardex — não há saída "silenciosa".', 'Auditoria completa.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Giro de estoque', formula: 'CMV_periodo / estoque_médio', target: 'Definir por curva ABC' },
      { name: 'Dias de cobertura', formula: 'estoque_atual / consumo_médio_diário', target: 'Alinhado ao lead time + safety stock' },
      { name: 'Itens sem movimento 90d', formula: 'count(itens_sem_saida_90d)', target: 'Reduzir mês a mês' },
    ],
    routines: [
      { when: 'Diariamente', action: 'Revisar itens abaixo do ponto de pedido.', responsible: 'Compras' },
      { when: 'Mensalmente', action: 'Recalcular curva ABC.', responsible: 'Logística' },
    ],
    integrations: [
      { with: 'Compras', what: 'Ponto de pedido dispara requisição.' },
      { with: 'Comercial', what: 'Consulta saldo e reserva ao confirmar pedido.' },
      { with: 'Produção', what: 'Consumo de componentes e entrada de produto acabado.' },
    ],
    antipatterns: [
      'Cadastrar produto sem NCM correto — trava fiscal no primeiro faturamento.',
      'Ajustar saldo manualmente sem contagem cega — apenas mascara divergência.',
    ],
  },
  contabilidade: {
    concept: 'Contabilidade é a espinha jurídica da empresa. Cada operação real vira partida dobrada; o balanço fecha porque o dia a dia estava correto — não porque foi "acertado" no fim do mês.',
    businessRules: [
      R('Lançamento sempre em partida dobrada com débito = crédito.', 'Regra contábil universal.', 'blocking'),
      R('Período fechado é imutável — reabertura exige autorização e é auditada.', 'Segurança contra fraude.', 'blocking'),
      R('Toda conta contábil precisa de classificação DRE.', 'Sem classificação, DRE fica furada.', 'warning'),
    ],
    keyMetrics: [
      { name: 'Dias para fechar o mês', formula: 't_fechamento - fim_do_mês', target: '< 5 dias úteis' },
      { name: 'Lançamentos ajustados manualmente', formula: 'ajustes / lançamentos_totais', target: '< 2%' },
    ],
    routines: [
      { when: 'Diariamente', action: 'Revisar lançamentos automáticos gerados pelos módulos.', responsible: 'Contábil' },
      { when: 'Mensalmente D+5', action: 'Fechar o período, gerar DRE e Balanço.', responsible: 'Contábil' },
    ],
    integrations: [
      { with: 'Financeiro', what: 'Baixas geram lançamento contábil.' },
      { with: 'Fiscal', what: 'NF-e vira crédito/débito de imposto e receita.' },
      { with: 'Produção', what: 'Encerramento de OP gera CPV.' },
    ],
    antipatterns: [
      'Deixar conta sem classificação DRE — DRE aparece "zerada".',
      'Editar lançamento automático sem entender a origem — quebra rastreamento.',
    ],
  },
  tms: {
    concept: 'TMS otimiza a última milha: custo de frete, prazo prometido e prova de entrega. Rota mal planejada come margem em silêncio.',
    businessRules: [
      R('Rota otimizada respeita restrições de peso, cubagem e janela do cliente.', 'Ignorar restrição = entrega recusada.', 'blocking'),
      R('POD é obrigatório para dar entrega como concluída.', 'Sem prova, disputa comercial é perdida.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'On Time Delivery (OTD)', formula: 'entregas_no_prazo / entregas_totais', target: '> 95%' },
      { name: 'Custo por entrega', formula: 'custo_rota / entregas_rota', target: 'Reduzir 5% ano' },
    ],
    routines: [
      { when: 'Diariamente 06:00', action: 'Consolidar pedidos e otimizar rotas.', responsible: 'Coordenador logístico' },
      { when: 'Continuamente', action: 'Live tracking dos motoristas.', responsible: 'Central' },
    ],
    integrations: [
      { with: 'WMS', what: 'Manifesto de saída vira carga.' },
      { with: 'Comercial', what: 'Cliente recebe status de entrega automático.' },
    ],
    antipatterns: [
      'Aceitar POD sem foto/assinatura — abre disputa.',
      'Rotas manuais no Excel — ignora restrições reais.',
    ],
  },
  'crm-nps': {
    concept: 'NPS não é troféu, é termômetro segmentado. Média agregada esconde detratores. Ligação para detrator vale mais que campanha em massa.',
    businessRules: [
      R('Detrator (nota 0-6) exige contato humano em até 48h.', 'É a janela para recuperar o cliente.', 'blocking'),
      R('NPS é analisado por segmento, não só como média global.', 'Média esconde subgrupos críticos.', 'warning'),
    ],
    keyMetrics: [
      { name: 'NPS por segmento', formula: '% promotores - % detratores', target: '> 40 (zona de excelência)' },
      { name: 'Taxa de resposta', formula: 'respostas / convites', target: '> 20%' },
    ],
    routines: [
      { when: 'Trimestralmente', action: 'Rodar campanha NPS por segmento.', responsible: 'CX' },
      { when: 'Semanalmente', action: 'Ligar para todos os detratores do período.', responsible: 'CX / Comercial' },
    ],
    integrations: [
      { with: 'Comercial', what: 'Detratores viram alerta comercial para retenção.' },
    ],
    antipatterns: [
      'Enviar NPS logo após compra — mede excitação, não experiência.',
      'Olhar apenas média — perde diagnóstico.',
    ],
  },
  executivo: {
    concept: 'A IA Executiva é um analista sênior 24×7. Ela consulta dados reais, propõe ações e — com guardrails — executa. Nunca substitui decisão humana em movimento crítico.',
    businessRules: [
      R('Ações de escrita (tool calling) exigem confirmação humana.', 'Guardrails contra alucinação.', 'blocking'),
      R('IA responde apenas com base em dados reais do tenant.', 'Sem mocks, sem invenção.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Taxa de aceite de sugestão', formula: 'sugestões_aceitas / sugestões_dadas', target: '> 60%' },
      { name: 'Tempo economizado (h/mês)', formula: 'Σ ganho por autopilot', target: 'Cresce mês a mês' },
    ],
    routines: [
      { when: 'Diariamente 07:00', action: 'Cron autopilot: resumo executivo no WhatsApp.', responsible: 'IA / Diretor' },
      { when: 'Semanalmente', action: 'Revisar Learning e corrigir respostas erradas.', responsible: 'Sponsor' },
    ],
    integrations: [
      { with: 'Todos', what: 'MCP tools consultam pedidos, AP, produtos, fiscal.' },
    ],
    antipatterns: [
      'Executar ação sugerida sem revisão em decisão financeira alta.',
      'Não corrigir erro no Learning — a IA repete o mesmo erro.',
    ],
  },
  'admin-usuarios': {
    concept: 'Papéis definem poder. Convide sempre com o menor papel possível e promova depois. Papel nunca fica no profile — sempre em user_roles.',
    businessRules: [
      R('Admin nunca é atribuído sem MFA ativo.', 'Admin sem MFA é vetor primário de comprometimento.', 'blocking'),
      R('Usuário não pode se auto-promover.', 'Escalada de privilégio.', 'blocking'),
      R('Toda mudança de papel gera evento ROLE_CHANGE auditado.', 'Compliance.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Usuários admin ativos', formula: 'count(admins ativos)', target: 'O menor possível (2-3)' },
      { name: 'Usuários sem login em 60d', formula: 'count(last_login < now-60d)', target: 'Desativar' },
    ],
    routines: [
      { when: 'Mensalmente', action: 'Revisar lista de admins e usuários inativos.', responsible: 'Administrador' },
      { when: 'Ao offboarding', action: 'Desativar imediatamente; nunca "guardar" login.', responsible: 'Administrador / RH' },
    ],
    integrations: [
      { with: 'Auditoria', what: 'ROLE_CHANGE, LOGIN_FAILED, PERMISSION_DENIED.' },
    ],
    antipatterns: [
      'Compartilhar login — quebra auditoria.',
      'Dar admin "temporário" e esquecer.',
    ],
  },
  'admin-empresas': {
    concept: 'Multi-empresa é a base do isolamento de dados. Cada CNPJ é um tenant lógico protegido por RLS.',
    businessRules: [
      R('Usuário só vê empresas às quais está vinculado.', 'RLS + get_user_company_id.', 'blocking'),
      R('Inativar empresa não apaga histórico.', 'Compliance fiscal.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Empresas ativas', formula: 'count(ativas)', target: '—' },
    ],
    routines: [
      { when: 'Ao abrir filial', action: 'Cadastrar CNPJ + regime + certificado próprio.', responsible: 'Admin + Contador' },
    ],
    integrations: [
      { with: 'Fiscal', what: 'Cada filial pode ter certificado próprio.' },
      { with: 'Contabilidade', what: 'Empresas consolidam em relatório societário.' },
    ],
    antipatterns: [
      'Usar uma única empresa para múltiplos CNPJs — quebra fiscal.',
    ],
  },
  'admin-parametros': {
    concept: 'Parâmetros deixam o sistema flexível sem código. Toda regra de negócio configurável vive aqui — nada de "gambiarra em campo obs".',
    businessRules: [
      R('Alterar parâmetro sensível exige confirmação e vira evento auditado.', 'Rastreabilidade.', 'warning'),
    ],
    keyMetrics: [
      { name: 'Parâmetros customizados vs. padrão', formula: 'customizados / total', target: 'Só o necessário' },
    ],
    routines: [
      { when: 'Após kickoff', action: 'Revisar cada categoria e ajustar aos processos da empresa.', responsible: 'Consultor + Áreas' },
    ],
    integrations: [
      { with: 'Todos', what: 'Parâmetros ditam o comportamento de cada módulo.' },
    ],
    antipatterns: [
      'Alterar parâmetro em produção sem testar em sandbox.',
    ],
  },
  'admin-seguranca': {
    concept: 'Auditoria é o backup do julgamento humano. Cada ação crítica deixa rastro imutável para revisão a qualquer momento.',
    businessRules: [
      R('Audit log é append-only — nunca editado ou apagado.', 'Base de compliance.', 'blocking'),
      R('Export exige papel admin + confirmação.', 'Dados sensíveis.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Eventos críticos semanais', formula: 'count(ROLE_CHANGE, DELETE) por semana', target: 'Investigar picos' },
    ],
    routines: [
      { when: 'Semanalmente', action: 'Revisar eventos ROLE_CHANGE e DELETE.', responsible: 'Compliance / Admin' },
      { when: 'Trimestralmente', action: 'Rodar security scan e tratar findings.', responsible: 'TI' },
    ],
    integrations: [
      { with: 'Todos', what: 'Todo módulo emite eventos críticos para o log.' },
    ],
    antipatterns: [
      'Ignorar eventos LOGIN_FAILED em massa — pode indicar tentativa de invasão.',
    ],
  },
  billing: {
    concept: 'Billing evita surpresa: o cliente sempre sabe onde está no plano e o que fazer para não bloquear a operação.',
    businessRules: [
      R('Aviso em 80% de uso, bloqueio em 100%.', 'Sem quebra silenciosa.', 'blocking'),
    ],
    keyMetrics: [
      { name: '% do medidor consumido', formula: 'consumido / limite', target: '< 80%' },
    ],
    routines: [
      { when: 'Mensalmente D+1', action: 'Revisar consumo do mês anterior e projetar necessidade.', responsible: 'Sponsor' },
    ],
    integrations: [
      { with: 'Todos', what: 'Cada módulo reporta consumo.' },
    ],
    antipatterns: [
      'Deixar chegar em 100% — bloqueio pára operação.',
    ],
  },
  rfid: {
    concept: 'RFID substitui contagem manual: passou perto do leitor, foi contado. Precisa hardware bem posicionado e tags padronizadas.',
    businessRules: [
      R('Tag duplicada gera evento de conflito e não é aceita.', 'Rastreabilidade única por item.', 'blocking'),
    ],
    keyMetrics: [
      { name: 'Leitura efetiva', formula: 'lidos / esperados na passagem', target: '> 98%' },
    ],
    routines: [
      { when: 'Diariamente', action: 'Verificar leitores offline.', responsible: 'TI / Logística' },
    ],
    integrations: [
      { with: 'WMS', what: 'Eventos alimentam saldos em tempo real.' },
    ],
    antipatterns: [
      'Colar tag em metal sem espaçamento — leitura ruim.',
    ],
  },
  relatorios: {
    concept: 'Relatório bom responde a uma pergunta única com dados fresh. Muitos filtros geralmente indicam falta de dashboards operacionais.',
    businessRules: [
      R('Relatório exportado leva marca d\'água com usuário e data.', 'Rastreabilidade em vazamento.', 'warning'),
    ],
    keyMetrics: [
      { name: 'Relatórios agendados vs. manuais', formula: 'agendados / total', target: 'Automatizar recorrentes' },
    ],
    routines: [
      { when: 'Semanalmente', action: 'Executar pacote de relatórios de gestão.', responsible: 'Gerentes' },
    ],
    integrations: [
      { with: 'IA Executiva', what: 'Autopilot pode enviar relatório por WhatsApp.' },
    ],
    antipatterns: [
      'Exportar Excel para todo mundo em vez de dar acesso ao dashboard.',
    ],
  },
};

const FALLBACK_FOUNDATION: ModuleFoundation = {
  concept: 'Este módulo integra-se aos demais para automatizar processos e preservar a integridade de dados por RLS multi-tenant.',
  businessRules: [
    R('Toda operação crítica pede confirmação explícita.', 'Reduz erro humano.', 'warning'),
    R('Toda alteração é auditada.', 'Rastreabilidade.', 'info'),
  ],
  keyMetrics: [],
  routines: [],
  integrations: [],
  antipatterns: ['Operar sem cadastros mestres completos.'],
};

export function getFoundation(slug: string): ModuleFoundation {
  return MODULE_FOUNDATION[slug] ?? FALLBACK_FOUNDATION;
}
