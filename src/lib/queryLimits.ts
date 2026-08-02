/**
 * Limites padrão de leitura (PERF-GUARD).
 *
 * Toda consulta de listagem em tabelas de alto volume (pedidos, movimentações de
 * estoque, notas fiscais, títulos financeiros) precisa de um teto explícito para
 * evitar degradação quando a base do cliente cresce. Use estes limites em vez de
 * números soltos, e prefira paginação (`range`) quando a tela expõe navegação.
 */

/** Listagens de tela (grids, kanbans, filas operacionais). */
export const LIST_LIMIT = 500;

/** Agregações e relatórios que varrem um período fechado. */
export const REPORT_LIMIT = 5000;

/** Extratos cronológicos (kardex, razão, auditoria). */
export const LEDGER_LIMIT = 2000;

/** Calcula o `range` do Supabase a partir de página (1-based) e tamanho. */
export function pageRange(page: number, pageSize: number): [number, number] {
  const safePage = Math.max(1, Math.floor(page));
  const from = (safePage - 1) * pageSize;
  return [from, from + pageSize - 1];
}
