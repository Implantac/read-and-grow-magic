import React from 'react';
import { useSourcingOptions, SourcingOption } from '@/hooks/operational/orchestration/useOrchestration';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Truck, Store, Package, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/ui/base/skeleton';

interface SourcingSelectorProps {
  productId: string;
  quantity: number;
  targetBranchId: string;
  onSelect: (option: SourcingOption) => void;
  selectedOption?: SourcingOption;
}

export default function SourcingSelector({ productId, quantity, targetBranchId, onSelect, selectedOption }: SourcingSelectorProps) {
  const { data: options, isLoading } = useSourcingOptions(productId, quantity, targetBranchId);

  if (isLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Origem do Estoque (Sourcing)</h3>
      </div>

      <div className="grid gap-3">
        {options?.map((option, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(option)}
            className={`flex items-center justify-between p-4 rounded-lg border transition-all text-left ${
              selectedOption === option 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'hover:border-primary/50 bg-background'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-md ${option.type === 'local' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {option.type === 'local' ? <Store className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold capitalize">
                  {option.type === 'local' ? 'Estoque Local' : 'Cross-docking'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {option.type === 'local' ? 'Disponível agora' : `Origem: Unidade ${option.branchId?.split('-')[0].toUpperCase()}`}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {option.leadTimeDays === 0 ? 'Imediato' : `${option.leadTimeDays} dias`}
                </span>
              </div>
              {option.cost > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Custo adicional: R$ {option.cost.toFixed(2)}
                </p>
              )}
            </div>
          </button>
        ))}

        {(!options || options.length === 0) && (
          <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
            <p className="text-sm italic">Buscando opções na rede...</p>
          </div>
        )}
      </div>
    </div>
  );
}
