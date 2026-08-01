/**
 * Extrai uma mensagem legível de qualquer erro (unknown) sem usar `any`.
 */
export function errorMessage(error: unknown, fallback = "Erro inesperado"): string {
  if (typeof error === "string") return error || fallback;
  if (error instanceof Error) return error.message || fallback;
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown; error_description?: unknown; details?: unknown };
    const candidate = maybe.message ?? maybe.error_description ?? maybe.details;
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return fallback;
}
