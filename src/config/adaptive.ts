export type Segment = 
  | 'textile' 
  | 'food_factory' 
  | 'pharma' 
  | 'distribution' 
  | 'services' 
  | 'retail' 
  | 'general' 
  | 'fio' 
  | 'tecelagem' 
  | 'animal_feed' 
  | 'industry' 
  | 'wholesaler' 
  | 'retail_chain' 
  | 'franchise' 
  | 'holding' 
  | 'apparel';

export interface SegmentConfig {
  label: string;
  allowedSections: string[];
  recommendedModules: string[];
}

export const SEGMENTS: Record<Segment, SegmentConfig> = {
  textile: {
    label: 'Indústria Têxtil',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Operacional', 'Comercial', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['PCP', 'Engenharia', 'Qualidade', 'Custos', 'Têxtil']
  },
  apparel: {
    label: 'Confecção / Vestuário',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Operacional', 'Comercial', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['PCP', 'PLM', 'Facções', 'Grades', 'Têxtil']
  },
  fio: {
    label: 'Fiação',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['PCP', 'Misturas', 'Fardos', 'Fiação']
  },
  tecelagem: {
    label: 'Tecelagem',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['PCP', 'Urdimento', 'Tingimento', 'Tecelagem']
  },
  pharma: {
    label: 'Farmacêutico',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['GMP', 'CQ', 'Qualidade', 'Rastreabilidade', 'Farmacêutico']
  },
  animal_feed: {
    label: 'Fábrica de Ração',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['Formulações', 'Bromatologia', 'PCP', 'Alimentos']
  },
  food_factory: {
    label: 'Indústria de Alimentos',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Financeiro', 'Gestão', 'Pacotes Verticais'],
    recommendedModules: ['PCP', 'Qualidade', 'Rastreabilidade', 'Alimentos']
  },
  industry: {
    label: 'Indústria Geral',
    allowedSections: ['Dashboard', 'Produção', 'Logística', 'Financeiro', 'Gestão', 'Operacional'],
    recommendedModules: ['PCP', 'MRP', 'Engenharia', 'Manutenção']
  },
  distribution: {
    label: 'Distribuidora',
    allowedSections: ['Dashboard', 'Logística', 'Operacional', 'Comercial', 'Financeiro', 'Gestão'],
    recommendedModules: ['WMS', 'TMS', 'Expedição', 'Vendas']
  },
  wholesaler: {
    label: 'Atacadista',
    allowedSections: ['Dashboard', 'Logística', 'Operacional', 'Comercial', 'Financeiro', 'Gestão'],
    recommendedModules: ['WMS', 'Vendas', 'CRM']
  },
  retail: {
    label: 'Varejo',
    allowedSections: ['Dashboard', 'Operacional', 'Comercial', 'Financeiro', 'Gestão'],
    recommendedModules: ['PDV', 'CRM', 'Fidelidade', 'Vendas']
  },
  retail_chain: {
    label: 'Rede de Lojas',
    allowedSections: ['Dashboard', 'Operacional', 'Comercial', 'Financeiro', 'Gestão', 'Logística'],
    recommendedModules: ['PDV', 'Transferências', 'Consignado', 'CRM']
  },
  franchise: {
    label: 'Franquia',
    allowedSections: ['Dashboard', 'Operacional', 'Comercial', 'Financeiro', 'Gestão'],
    recommendedModules: ['PDV', 'Royalties', 'Consignado', 'CRM']
  },
  holding: {
    label: 'Holding / Grupo Empresarial',
    allowedSections: ['Dashboard', 'Gestão', 'Financeiro', 'Comercial'],
    recommendedModules: ['Consolidação', 'Auditoria', 'Executive']
  },
  services: {
    label: 'Prestação de Serviços',
    allowedSections: ['Dashboard', 'Comercial', 'Financeiro', 'Gestão'],
    recommendedModules: ['Projetos', 'Contratos', 'Faturamento']
  },
  general: {
    label: 'Geral / Outros',
    allowedSections: ['Dashboard', 'Operacional', 'Comercial', 'Financeiro', 'Gestão', 'Logística', 'Produção'],
    recommendedModules: ['Básico', 'Financeiro', 'Comercial']
  }
};

export const COMPANY_SIZES = [
  'Microempresa (ME)',
  'Empresa de Pequeno Porte (EPP)',
  'Média Empresa',
  'Grande Empresa',
  'Multinacional'
];

export const TAX_REGIMES = [
  'Simples Nacional',
  'Lucro Presumido',
  'Lucro Real',
  'MEI'
];
