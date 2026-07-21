import { ChevronRight } from "lucide-react";
import type { StorefrontSearchItem, PublicCategory } from "@/hooks/useStorefrontSearch";
import { BRL, priceOf } from "./utils";

interface SearchSuggestionsProps {
  products: StorefrontSearchItem[];
  cats: PublicCategory[];
  currency: string;
  onSelectCategory: (id: string) => void;
  onSelectProductName: (name: string) => void;
}

export function SearchSuggestions({
  products,
  cats,
  currency,
  onSelectCategory,
  onSelectProductName,
}: SearchSuggestionsProps) {
  if (products.length === 0 && cats.length === 0) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg overflow-hidden z-50">
      {cats.length > 0 && (
        <div className="p-2 border-b">
          <p className="text-[10px] uppercase text-muted-foreground px-2 mb-1">Categorias</p>
          {cats.map((c) => (
            <button
              key={c.id}
              onMouseDown={() => onSelectCategory(c.id)}
              className="w-full flex items-center gap-2 text-left px-2 py-1.5 hover:bg-accent rounded text-sm"
            >
              <ChevronRight className="h-3 w-3" /> {c.name}
            </button>
          ))}
        </div>
      )}
      {products.length > 0 && (
        <div className="p-2">
          <p className="text-[10px] uppercase text-muted-foreground px-2 mb-1">Produtos</p>
          {products.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => onSelectProductName(p.product.name)}
              className="w-full flex items-center gap-3 text-left px-2 py-1.5 hover:bg-accent rounded"
            >
              {p.product.image_url ? (
                <img src={p.product.image_url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate">{p.product.name}</p>
                <p className="text-xs text-muted-foreground">{BRL(priceOf(p), currency)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
