import { Factory, Store, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductNature } from '@/hooks/inventory/useProducts';

const natures: { value: ProductNature; label: string; hint: string; icon: any }[] = [
  { value: 'industry', label: 'Indústria', hint: 'Fabricação própria com BOM e roteiro', icon: Factory },
  { value: 'commerce', label: 'Comércio', hint: 'Revenda de mercadorias', icon: Store },
  { value: 'service', label: 'Serviço', hint: 'Serviços tributados por ISS', icon: Briefcase },
];

interface Props {
  value: ProductNature;
  onChange: (v: ProductNature) => void;
}

export function NatureSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {natures.map((n) => {
        const Icon = n.icon;
        const active = value === n.value;
        return (
          <button
            key={n.value}
            type="button"
            onClick={() => onChange(n.value)}
            className={cn(
              'rounded-lg border p-4 text-left transition-all',
              active
                ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                : 'border-border hover:border-primary/40 hover:bg-muted/40'
            )}
          >
            <Icon className={cn('h-5 w-5 mb-2', active ? 'text-primary' : 'text-muted-foreground')} />
            <div className="font-semibold text-sm">{n.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{n.hint}</div>
          </button>
        );
      })}
    </div>
  );
}
