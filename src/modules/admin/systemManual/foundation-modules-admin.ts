import type { BusinessRule, ModuleFoundation } from './foundation-types';

const R = (rule: string, reason: string, severity: BusinessRule['severity'] = 'warning'): BusinessRule => ({ rule, reason, severity });

export const ADMIN_FOUNDATION: Record<string, ModuleFoundation> = {
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
