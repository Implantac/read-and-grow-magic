import { CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/base/select';
import { periodOptions } from '@/config/accounting';

interface PeriodSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  compareValue?: string;
  onCompareChange?: (value: string) => void;
}

export function PeriodSelector({ value, onValueChange, compareValue, onCompareChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {onCompareChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">vs</span>
          <Select value={compareValue || ''} onValueChange={onCompareChange}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Comparar com..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem comparação</SelectItem>
              {periodOptions
                .filter((opt) => opt.value !== value)
                .map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
