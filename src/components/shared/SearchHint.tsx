import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SearchHintProps {
  /** Texto antes do atalho (ex.: "Pressione") */
  prefix?: string;
  /** Tecla(s) de atalho a destacar */
  keys: string | string[];
  /** Texto após o atalho */
  children: ReactNode;
  /** Rótulo introdutório (default: "Dica") */
  label?: string;
  className?: string;
}

/**
 * Dica padronizada para campos de busca/filtro.
 * Usa tokens semânticos para manter contraste consistente em light/dark
 * e estados (hover/focus) acessíveis.
 */
export function SearchHint({
  prefix = 'Pressione',
  keys,
  children,
  label = 'Dica',
  className,
}: SearchHintProps) {
  const keyList = Array.isArray(keys) ? keys : [keys];

  return (
    <p
      className={cn(
        'text-[11px] leading-none text-muted-foreground mt-1.5 pl-3',
        'transition-colors',
        className,
      )}
    >
      <span className="font-medium text-foreground/70">{label}:</span>{' '}
      {prefix}{' '}
      {keyList.map((k, i) => (
        <span key={i}>
          {i > 0 && <span className="text-muted-foreground/60"> + </span>}
          <kbd
            className={cn(
              'pointer-events-none inline-flex h-4 select-none items-center gap-1',
              'rounded border border-border bg-muted px-1.5 mx-0.5',
              'font-mono text-[10px] font-semibold text-foreground shadow-sm',
              'transition-colors hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {k}
          </kbd>
        </span>
      ))}{' '}
      {children}
    </p>
  );
}
