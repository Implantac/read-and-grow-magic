import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/base/popover';

export interface SmartSelectOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
}

interface SmartSelectProps {
  options: SmartSelectOption[];
  value?: string;
  onChange: (value: string, option: SmartSelectOption) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchKeys?: ('label' | 'description' | 'meta')[];
  className?: string;
  disabled?: boolean;
}

/**
 * Combobox inteligente com busca em múltiplos campos.
 * Usado para clientes, produtos, transportadoras, etc.
 */
export function SmartSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  emptyMessage = 'Nenhum resultado encontrado',
  searchKeys = ['label', 'description', 'meta'],
  className,
  disabled,
}: SmartSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 50);
    const q = search.toLowerCase();
    return options
      .filter((o) =>
        searchKeys.some((k) => (o[k] || '').toString().toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [options, search, searchKeys]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value, opt);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors',
                  value === opt.value && 'bg-accent'
                )}
              >
                <Check
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    value === opt.value ? 'opacity-100 text-primary' : 'opacity-0'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{opt.label}</div>
                  {(opt.description || opt.meta) && (
                    <div className="text-xs text-muted-foreground truncate">
                      {opt.description}
                      {opt.description && opt.meta && ' • '}
                      {opt.meta}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
