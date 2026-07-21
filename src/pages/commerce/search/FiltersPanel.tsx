import { Star, X } from "lucide-react";
import { Button } from "@/ui/base/button";
import { Checkbox } from "@/ui/base/checkbox";
import { Slider } from "@/ui/base/slider";
import { Label } from "@/ui/base/label";
import { RadioGroup, RadioGroupItem } from "@/ui/base/radio-group";
import type { PublicCategory } from "@/hooks/useStorefrontSearch";
import { BRL } from "./utils";

interface FiltersPanelProps {
  parents: PublicCategory[];
  childrenByParent: Map<string, PublicCategory[]>;
  selectedCategories: Set<string>;
  toggleCategory: (id: string) => void;
  priceBounds: { min: number; max: number };
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  currency: string;
  activeFilterCount: number;
  clearFilters: () => void;
}

export function FiltersPanel({
  parents,
  childrenByParent,
  selectedCategories,
  toggleCategory,
  priceBounds,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  currency,
  activeFilterCount,
  clearFilters,
}: FiltersPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm">Categorias</h3>
        {parents.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem categorias disponíveis.</p>
        ) : (
          <div className="space-y-3">
            {parents.map((p) => {
              const kids = childrenByParent.get(p.id) ?? [];
              return (
                <div key={p.id}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCategories.has(p.id)}
                      onCheckedChange={() => toggleCategory(p.id)}
                    />
                    <span className="text-sm font-medium">{p.name}</span>
                  </label>
                  {kids.length > 0 && (
                    <div className="ml-6 mt-2 space-y-1">
                      {kids.map((k) => (
                        <label key={k.id} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedCategories.has(k.id)}
                            onCheckedChange={() => toggleCategory(k.id)}
                          />
                          <span className="text-xs text-muted-foreground">{k.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm">Faixa de preço</h3>
        <Slider
          min={priceBounds.min}
          max={priceBounds.max}
          step={Math.max(1, Math.floor((priceBounds.max - priceBounds.min) / 100))}
          value={priceRange}
          onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
          className="mb-3"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{BRL(priceRange[0], currency)}</span>
          <span>{BRL(priceRange[1], currency)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm">Avaliação mínima</h3>
        <RadioGroup value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))}>
          {[0, 3, 4, 4.5].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem value={String(r)} id={`r-${r}`} />
              <Label htmlFor={`r-${r}`} className="text-sm flex items-center gap-1 cursor-pointer">
                {r === 0 ? (
                  "Qualquer"
                ) : (
                  <>
                    <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
                    {r}+
                  </>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" /> Limpar filtros
        </Button>
      )}
    </div>
  );
}
