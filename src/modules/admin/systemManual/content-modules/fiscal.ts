import { FileText, ShieldCheck, DollarSign, Wallet } from 'lucide-react';
import type { ModuleManual } from '../content-types';

export const FISCAL_MODULES: ModuleManual[] = [
  {
    slug: 'fiscal',
    title: 'Fiscal & Tributário',
    category: 'Fiscal',
    icon: FileText,
    short: 'NF-e/NFC-e, SPED, DIFAL, ICMS-ST e motor de cálculo tributário.',
    overview: [
      'O módulo Fiscal é o coração legal da empresa. Ele automatiza a emissão de documentos (NF-e, NFC-e), calcula impostos em tempo real e gera as obrigações mensais (SPED).',
      'Integra-se ao Comercial para faturamento e ao Financeiro para geração automática de títulos.'
    ],
    routes: [
      { label: 'Painel Fiscal', path: '/fiscal' },
      { label: 'Certificado A1', path: '/fiscal/certificado' },
      { label: 'Regras Tributárias', path: '/fiscal/regras' },
      { label: 'SPED', path: '/fiscal/sped' }
    ],
    personas: ['Analista Fiscal', 'Contador', 'Gerente Financeiro'],
    prerequisites: ['Certificado A1 (.pfx) ativo', 'Configuração de alíquotas por UF', 'Cadastro de NCM nos produtos'],
    steps: [
      { title: 'Configurar Certificado', description: 'Vá em Fiscal → Certificado. Faça upload do arquivo .pfx e informe a senha. Sem isso, a transmissão fica em modo simulado.' },
      { title: 'Definir Regras de Imposto', description: 'Em Regras Tributárias, configure as alíquotas de ICMS, PIS e COFINS por estado e tipo de operação.' },
      { title: 'Faturar Pedido', description: 'Ao aprovar um pedido no Comercial, clique em "Emitir NF-e". O sistema valida os dados e envia para a SEFAZ.' },
      { title: 'Gerar Obrigações', description: 'No fim do mês, use a aba SPED para gerar os arquivos TXT para sua contabilidade.' }
    ],
    sections: [
      { heading: 'Motor Tributário', paragraphs: ['O sistema calcula automaticamente Substituição Tributária e DIFAL com base no NCM do produto e UF do cliente.'] }
    ],
    faq: [
      { q: 'O que é o modo Simulado?', a: 'É quando o sistema gera a nota mas não envia para o governo, usado para testes iniciais.' }
    ],
    troubleshooting: [
      { problem: 'Rejeição de Assinatura', solution: 'Verifique se a senha do certificado A1 está correta e se ele não expirou.' }
    ],
    screenshots: []
  }
];
