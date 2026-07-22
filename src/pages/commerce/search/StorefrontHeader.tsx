import { Search, SlidersHorizontal, X, ShoppingCart, Store as StoreIcon } from "lucide-react";
import { Input } from "@/ui/base/input";
import { Button } from "@/ui/base/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/base/sheet";
import { SearchSuggestions } from "./SearchSuggestions";
import type { StorefrontSearchItem, PublicCategory } from "@/hooks/useStorefrontSearch";
import type { ReactNode } from "react";

type Store = {
  name: string; logo_url?: string | null;
  primary_color: string; secondary_color: string; currency: string;
};

type Props = {
  store: Store;
  slug: string;
  query: string; setQuery: (v: string) => void;
  suggestOpen: boolean; setSuggestOpen: (v: boolean) => void;
  suggestions: { products: StorefrontSearchItem[]; cats: PublicCategory[] };
  toggleCategory: (id: string) => void;
  activeFilterCount: number;
  filtersPanel: ReactNode;
  onLogoClick: () => void;
  onCartClick: () => void;
};

export function StorefrontHeader({
  store, query, setQuery, suggestOpen, setSuggestOpen, suggestions,
  toggleCategory, activeFilterCount, filtersPanel, onLogoClick, onCartClick,
}: Props) {
  return (
    <header
      className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur"
      style={{ borderColor: store.primary_color + "20" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <button onClick={onLogoClick} className="flex items-center gap-2 shrink-0">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-8" />
          ) : (
            <div
              className="h-8 w-8 rounded"
              style={{ background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})` }}
            />
          )}
          <span className="font-semibold hidden sm:inline">{store.name}</span>
        </button>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
            placeholder="Buscar produtos, marcas, categorias..."
            className="pl-9 pr-9"
            aria-label="Buscar produtos"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {suggestOpen && (
            <SearchSuggestions
              products={suggestions.products}
              cats={suggestions.cats}
              currency={store.currency}
              onSelectCategory={(id) => { toggleCategory(id); setQuery(""); }}
              onSelectProductName={(name) => setQuery(name)}
            />
          )}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden relative" aria-label="Filtros">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="mt-6">{filtersPanel}</div>
          </SheetContent>
        </Sheet>

        <Button
          variant="default"
          size="icon"
          onClick={onCartClick}
          aria-label="Ir para checkout"
          style={{ backgroundColor: store.primary_color }}
        >
          <ShoppingCart className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export { StoreIcon };
