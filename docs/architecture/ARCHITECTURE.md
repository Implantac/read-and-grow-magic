# Arquitetura do Sistema - READ & GROW
Data: 2026-08-06

## Stack Tecnológica
- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn UI
- **Estado/Dados**: TanStack Query (React Query)
- **Backend**: Lovable Cloud (Supabase)
  - PostgreSQL (Banco de Dados)
  - Edge Functions (Lógica de Servidor)
  - RLS (Segurança de Linha)
  - Auth (Autenticação)

## Domínios Principais
- **Financial**: Gestão de contas a pagar/receber, conciliação e DRE.
- **WMS**: Gestão de armazém, estoque, picking e packing.
- **Fiscal**: Emissão de documentos fiscais (NF-e, NFC-e, CT-e).
- **Relacionamento**: Gestão de NPS e experiência do cliente.
- **Production**: Controle de ordens de produção e OEE.

## Fluxo de Dados Padronizado
UI Components -> Custom Hooks (React Query) -> Supabase Client -> RLS Policies -> PostgreSQL Tables
