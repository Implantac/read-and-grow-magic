import type { StatusConfig, UserRole, UserStatus, CompanyStatus, ParameterCategory, Permission } from '@/types/administration';

export const userStatusConfig: Record<UserStatus, StatusConfig> = {
  active: { value: 'active', label: 'Ativo', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactive: { value: 'inactive', label: 'Inativo', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  pending: { value: 'pending', label: 'Pendente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  blocked: { value: 'blocked', label: 'Bloqueado', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const userRoleConfig: Record<UserRole, StatusConfig> = {
  admin: { value: 'admin', label: 'Administrador', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  manager: { value: 'manager', label: 'Gerente', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  operator: { value: 'operator', label: 'Operador', color: 'text-green-700', bgColor: 'bg-green-100' },
  viewer: { value: 'viewer', label: 'Visualizador', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  diretor: { value: 'diretor', label: 'Diretor', color: 'text-red-700', bgColor: 'bg-red-100' },
  financeiro: { value: 'financeiro', label: 'Financeiro', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  fiscal: { value: 'fiscal', label: 'Fiscal', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  contabil: { value: 'contabil', label: 'Contábil', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  compras: { value: 'compras', label: 'Compras', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  producao: { value: 'producao', label: 'Produção', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  logistica: { value: 'logistica', label: 'Logística', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  comercial: { value: 'comercial', label: 'Comercial', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  loja: { value: 'loja', label: 'Loja', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  franquia: { value: 'franquia', label: 'Franquia', color: 'text-violet-700', bgColor: 'bg-violet-100' },
};

export const companyStatusConfig: Record<CompanyStatus, StatusConfig> = {
  active: { value: 'active', label: 'Ativa', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactive: { value: 'inactive', label: 'Inativa', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const parameterCategoryConfig: Record<ParameterCategory, StatusConfig> = {
  general: { value: 'general', label: 'Geral', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  fiscal: { value: 'fiscal', label: 'Fiscal', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  commercial: { value: 'commercial', label: 'Comercial', color: 'text-green-700', bgColor: 'bg-green-100' },
  financial: { value: 'financial', label: 'Financeiro', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  production: { value: 'production', label: 'Produção', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  wms: { value: 'wms', label: 'WMS', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  purchasing: { value: 'purchasing', label: 'Compras', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  integration: { value: 'integration', label: 'Integrações', color: 'text-pink-700', bgColor: 'bg-pink-100' },
};

export const defaultPermissions: Permission[] = [
  { id: 'PERM001', code: 'dashboard.read', name: 'Visualizar Dashboard', description: 'Acesso ao dashboard principal', module: 'Dashboard' },
  { id: 'PERM002', code: 'commercial.read', name: 'Visualizar Comercial', description: 'Visualizar dados do módulo comercial', module: 'Comercial' },
  { id: 'PERM003', code: 'commercial.write', name: 'Editar Comercial', description: 'Criar e editar dados do módulo comercial', module: 'Comercial' },
  { id: 'PERM004', code: 'commercial.delete', name: 'Excluir Comercial', description: 'Excluir dados do módulo comercial', module: 'Comercial' },
  { id: 'PERM005', code: 'financial.read', name: 'Visualizar Financeiro', description: 'Visualizar dados do módulo financeiro', module: 'Financeiro' },
  { id: 'PERM006', code: 'financial.write', name: 'Editar Financeiro', description: 'Criar e editar dados do módulo financeiro', module: 'Financeiro' },
  { id: 'PERM007', code: 'financial.delete', name: 'Excluir Financeiro', description: 'Excluir dados do módulo financeiro', module: 'Financeiro' },
  { id: 'PERM008', code: 'fiscal.read', name: 'Visualizar Fiscal', description: 'Visualizar dados do módulo fiscal', module: 'Fiscal' },
  { id: 'PERM009', code: 'fiscal.write', name: 'Emitir Documentos Fiscais', description: 'Emitir NF-e, NFC-e e outros documentos', module: 'Fiscal' },
  { id: 'PERM010', code: 'fiscal.cancel', name: 'Cancelar Documentos Fiscais', description: 'Cancelar documentos fiscais emitidos', module: 'Fiscal' },
  { id: 'PERM011', code: 'production.read', name: 'Visualizar Produção', description: 'Visualizar dados do módulo de produção', module: 'Produção' },
  { id: 'PERM012', code: 'production.write', name: 'Editar Produção', description: 'Criar e editar ordens de produção', module: 'Produção' },
  { id: 'PERM013', code: 'wms.read', name: 'Visualizar WMS', description: 'Visualizar dados do módulo WMS', module: 'WMS' },
  { id: 'PERM014', code: 'wms.write', name: 'Operar WMS', description: 'Realizar operações de recebimento, picking, etc', module: 'WMS' },
  { id: 'PERM015', code: 'purchasing.read', name: 'Visualizar Compras', description: 'Visualizar dados do módulo de compras', module: 'Compras' },
  { id: 'PERM016', code: 'purchasing.write', name: 'Editar Compras', description: 'Criar e editar pedidos de compra', module: 'Compras' },
  { id: 'PERM017', code: 'purchasing.approve', name: 'Aprovar Compras', description: 'Aprovar pedidos de compra', module: 'Compras' },
  { id: 'PERM018', code: 'reports.read', name: 'Visualizar Relatórios', description: 'Acessar relatórios do sistema', module: 'Relatórios' },
  { id: 'PERM019', code: 'reports.export', name: 'Exportar Relatórios', description: 'Exportar relatórios para PDF/Excel', module: 'Relatórios' },
  { id: 'PERM020', code: 'admin.users', name: 'Gerenciar Usuários', description: 'Criar, editar e excluir usuários', module: 'Administração' },
  { id: 'PERM021', code: 'admin.companies', name: 'Gerenciar Empresas', description: 'Gerenciar empresas e filiais', module: 'Administração' },
  { id: 'PERM022', code: 'admin.parameters', name: 'Gerenciar Parâmetros', description: 'Configurar parâmetros do sistema', module: 'Administração' },
];
