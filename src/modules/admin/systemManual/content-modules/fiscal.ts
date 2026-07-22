import { FileText } from 'lucide-react';
import { commonScreens, type ModuleManual } from '../content-types';

export const FISCAL_MODULES: ModuleManual[] = [
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
];
