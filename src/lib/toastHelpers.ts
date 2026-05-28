import { toast } from '@/hooks/use-toast';

/**
 * Helpers padronizados para exibir toasts.
 * Use ao invés de duplicar `toast({ title: 'Erro', description: ..., variant: 'destructive' })`.
 */

/** Toast de erro genérico. Aceita Error, string ou objeto com `message`. */
export function toastError(error: unknown, fallback = 'Ocorreu um erro inesperado') {
  const description =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : (error as { message?: string })?.message ?? fallback;
  toast({ title: 'Erro', description, variant: 'destructive' });
}

/** Toast de sucesso simples. */
export function toastSuccess(title: string, description?: string) {
  toast({ title, description });
}

/** Helper para onError de mutations React Query. */
export const handleMutationError = (e: unknown) => toastError(e);
