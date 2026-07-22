import { Filter } from "lucide-react";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Checkbox } from "@/ui/base/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/base/popover";
import { Separator } from "@/ui/base/separator";
import { X } from "lucide-react";

export function MultiSelectPopover({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 text-xs gap-1 flex-1 justify-start">
          <Filter className="h-3 w-3" />
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1">{selected.length}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">Nenhuma opção disponível.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted cursor-pointer">
                <Checkbox checked={selected.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                <span className="capitalize">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <>
            <Separator className="my-1" />
            <Button variant="ghost" size="xs" onClick={() => onChange([])} className="w-full text-xs">Limpar</Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="text-[10px] gap-1 pr-1">
      {label}
      <button onClick={onRemove} className="rounded-sm hover:bg-background/50 p-0.5" aria-label={`Remover filtro ${label}`}>
        <X className="h-2.5 w-2.5" />
      </button>
    </Badge>
  );
}
