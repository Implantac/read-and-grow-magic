import { Star, X } from "lucide-react";
import { Badge } from "@/ui/base/badge";
import { BRL } from "./utils";
import type { PublicCategory } from "@/hooks/useStorefrontSearch";

type Props = {
  selectedCategories: Set<string>;
  catById: Map<string, PublicCategory>;
  toggleCategory: (id: string) => void;
  minRating: number; setMinRating: (v: number) => void;
  priceRange: [number, number]; setPriceRange: (v: [number, number]) => void;
  priceBounds: { min: number; max: number };
  currency: string;
};

export function ActiveFilterChips({
  selectedCategories, catById, toggleCategory,
  minRating, setMinRating, priceRange, setPriceRange, priceBounds, currency,
}: Props) {
  const priceChanged = priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {Array.from(selectedCategories).map((cid) => {
        const c = catById.get(cid);
        return (
          <Badge key={cid} variant="secondary" className="gap-1">
            {c?.name ?? "Categoria"}
            <button onClick={() => toggleCategory(cid)} aria-label="Remover filtro">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      {minRating > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Star className="h-3 w-3 fill-current" /> {minRating}+
          <button onClick={() => setMinRating(0)} aria-label="Remover avaliação">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {priceChanged && (
        <Badge variant="secondary" className="gap-1">
          {BRL(priceRange[0], currency)} — {BRL(priceRange[1], currency)}
          <button
            onClick={() => setPriceRange([priceBounds.min, priceBounds.max])}
            aria-label="Remover preço"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
