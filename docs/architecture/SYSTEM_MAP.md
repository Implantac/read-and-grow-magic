# System Map (Mapa Oficial do Sistema)

## Domínios e Responsabilidades

### CORE
- **Objetivo**: Gestão de identidade, tenant e infraestrutura básica.
- **Entidades**: `companies`, `profiles`, `user_roles`.
- **Services**: `src/services/system/authService.ts`.
- **Tabelas**: `public.profiles`, `public.companies`.

### ADMIN
- **Objetivo**: Configurações globais, auditoria e gestão de recursos.
- **Páginas**: `/admin/usuarios`, `/admin/empresa`, `/admin/configuracoes`.
- **Hooks**: `src/hooks/system/useUsers.ts`.

### COMERCIAL / CRM
- **Objetivo**: Ciclo de vendas e gestão de clientes.
- **Páginas**: `/comercial/pedidos`, `/comercial/clientes`.
- **Processo Crítico**: Order-to-Cash (O2C).

### OPERACIONAL / WMS
- **Objetivo**: Logística, armazenamento e movimentação de mercadorias.
- **Páginas**: `/operacional/abastecimento`, `/operacional/wms`.
- **Entidades**: `stock_locations`, `supply_chain_movements`.

### FINANCEIRO
- **Objetivo**: Fluxo de caixa, conciliação e gestão de títulos.
- **Páginas**: `/financeiro/contas-receber`, `/financeiro/fluxo-caixa`.

### FISCAL
- **Objetivo**: Conformidade tributária e emissão de documentos.
- **Páginas**: `/fiscal/nfe`, `/fiscal/sped`.

### PRODUÇÃO / PCP
- **Objetivo**: Transformação de matéria-prima e gestão de capacidade.
- **Hooks**: `src/hooks/production/useProductionOrders.ts`.

## Integrações
- **Supabase**: Auth, DB, Realtime.
- **BrasilAPI**: Consulta de CNPJ.
- **WhatsApp/Instagram**: (Planejado/Iniciado) Venda e notificações.

## Estado de Auditoria
- **RLS**: 100% habilitado.
- **Isolamento**: Tenant-based (company_id).
