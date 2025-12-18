import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'number';
  options?: FilterOption[];
  placeholder?: string;
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onClear: () => void;
}

export function AdvancedFilters({
  fields,
  values,
  onChange,
  onClear,
}: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localValues, setLocalValues] = useState(values);

  const activeFiltersCount = Object.values(values).filter(Boolean).length;

  const handleChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onChange(localValues);
    setOpen(false);
  };

  const handleClear = () => {
    const emptyValues: Record<string, string> = {};
    fields.forEach((field) => {
      emptyValues[field.key] = '';
    });
    setLocalValues(emptyValues);
    onClear();
    setOpen(false);
  };

  const handleRemoveFilter = (key: string) => {
    const newValues = { ...values, [key]: '' };
    setLocalValues(newValues);
    onChange(newValues);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Filtros Avançados</SheetTitle>
            <SheetDescription>
              Configure os filtros para refinar sua busca
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-4">
            {fields.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === 'select' && field.options ? (
                  <Select
                    value={localValues[field.key] || ''}
                    onValueChange={(value) => handleChange(field.key, value)}
                  >
                    <SelectTrigger id={field.key}>
                      <SelectValue placeholder={field.placeholder || 'Selecione...'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === 'date' ? (
                  <Input
                    id={field.key}
                    type="date"
                    value={localValues[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    id={field.key}
                    type="number"
                    placeholder={field.placeholder}
                    value={localValues[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type="text"
                    placeholder={field.placeholder}
                    value={localValues[field.key] || ''}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={handleClear}>
              Limpar Filtros
            </Button>
            <Button onClick={handleApply}>Aplicar Filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Active filter badges */}
      {Object.entries(values).map(([key, value]) => {
        if (!value) return null;
        const field = fields.find((f) => f.key === key);
        if (!field) return null;

        let displayValue = value;
        if (field.type === 'select' && field.options) {
          const option = field.options.find((o) => o.value === value);
          displayValue = option?.label || value;
        }

        return (
          <Badge key={key} variant="secondary" className="gap-1 pl-2">
            <span className="text-muted-foreground">{field.label}:</span>
            <span>{displayValue}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 px-1 hover:bg-transparent"
              onClick={() => handleRemoveFilter(key)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        );
      })}
    </div>
  );
}
