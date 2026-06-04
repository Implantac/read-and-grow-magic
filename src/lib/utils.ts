import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitário para mesclar classes Tailwind com segurança.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um documento (CNPJ/CPF) com máscara.
 */
export function formatDocument(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (cleanValue.length === 14) {
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

/**
 * Gera um ID aleatório curto para uso em UI (não seguro para DB).
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce simples para funções.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
