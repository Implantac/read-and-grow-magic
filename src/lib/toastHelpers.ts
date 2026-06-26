/**
 * Utilitários de feedback visual (Toasts).
 * Centraliza a exibição de mensagens para manter consistência em toda a aplicação.
 */
import { toast } from '@/hooks/use-toast';

/**
 * Mapeia erros crus do Postgres/PostgREST/Supabase para mensagens
 * amigáveis em PT-BR, evitando vazamento de estrutura interna do banco
 * (nomes de tabelas, colunas, policies, codes do PostgREST).
 */
function sanitizeErrorMessage(raw: string, fallback: string): string {
  if (!raw) return fallback;
  const msg = raw.trim();

  // Padrões internos que não devem ser expostos ao usuário final
  const leakyPatterns = [
    /relation .* does not exist/i,
    /column .* does not exist/i,
    /violates .* constraint/i,
    /violates row-level security/i,
    /permission denied for /i,
    /pgrst\d+/i,
    /jwt/i,
    /duplicate key value/i,
    /foreign key/i,
    /policy /i,
    /^new row violates/i,
    /search_path/i,
    /function .* does not exist/i,
  ];

  if (leakyPatterns.some((re) => re.test(msg))) {
    return fallback;
  }

  // Mensagens muito longas (>200 chars) provavelmente são stack/SQL — trunca
  if (msg.length > 200) return fallback;

  return msg;
}

/** Toast de erro genérico. Aceita Error, string ou objeto com `message`. */
export function toastError(error: unknown, fallback = 'Ocorreu um erro inesperado', title = 'Erro') {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (error as { message?: string })?.message ?? '';
  const description = sanitizeErrorMessage(raw, fallback);
  toast({ title, description, variant: 'destructive' });
}

/** Toast de sucesso simples. */
export function toastSuccess(title: string, description?: string) {
  toast({ title, description });
}

/** Helper para onError de mutations React Query. */
export const handleMutationError = (e: unknown) => toastError(e);

/** Factory que cria handler onError com título customizado. */
export const mutationErrorHandler = (title: string) => (e: unknown) => toastError(e, undefined, title);
