import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, Star, SlidersHorizontal, X, ChevronRight, Store as StoreIcon, ShoppingCart } from "lucide-react";
import { Input } from "@/ui/base/input";
import { Button } from "@/ui/base/button";
import { Card, CardContent } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { Slider } from "@/ui/base/slider";
import { Checkbox } from "@/ui/base/checkbox";
import { Label } from "@/ui/base/label";
import { RadioGroup, RadioGroupItem } from "@/ui/base/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/base/sheet";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  usePublicStorefrontBySlug,
  useStorefrontSearchItems,
  useStorefrontCategories,
  type StorefrontSearchItem,
  type PublicCategory,
} from "@/hooks/useStorefrontSearch";

const BRL = (v: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(v);

function priceOf(it: StorefrontSearchItem) {
  return it.public_price ?? it.product.sale_price ?? 0;
}

type SortKey = "relevance" | "price_asc" | "price_desc" | "rating_desc" | "featured";

export default function StorefrontSearch() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: store, isLoading: loadingStore } = usePublicStorefrontBySlug(slug);
  const { data: items = [], isLoading: loadingItems } = useStorefrontSearchItems(store?.id);
  const { data: categories = [] } = useStorefrontCategories(items);

  // Filters
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(searchParams.getAll("cat"))
  );
  const [minRating, setMinRating] = useState<number>(
    Number(searchParams.get("rating") ?? 0)
  );
  const [sort, setSort] = useState<SortKey>(
    (searchParams.get("sort") as SortKey) ?? "relevance"
  );
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Price bounds derived from data
  const priceBounds = useMemo(() => {
    if (!items.length) return { min: 0, max: 1000 };
    const prices = items.map(priceOf);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [items]);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("pmin") ?? priceBounds.min),
    Number(searchParams.get("pmax") ?? priceBounds.max),
  ]);

  // Sync price range when bounds change (first data load)
  useEffect(() => {
    if (!searchParams.get("pmin") && !searchParams.get("pmax")) {
      setPriceRange([priceBounds.min, priceBounds.max]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceBounds.min, priceBounds.max]);

  // Persist filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    selectedCategories.forEach((c) => params.append("cat", c));
    if (minRating > 0) params.set("rating", String(minRating));
    if (sort !== "relevance") params.set("sort", sort);
    if (priceRange[0] !== priceBounds.min) params.set("pmin", String(priceRange[0]));
    if (priceRange[1] !== priceBounds.max) params.set("pmax", String(priceRange[1]));
    setSearchParams(params, { replace: true });
  }, [query, selectedCategories, minRating, sort, priceRange, priceBounds, setSearchParams]);

  // Category hierarchy (parents + subcategories)
  const { parents, childrenByParent, catById } = useMemo(() => {
    const catById = new Map<string, PublicCategory>();
    categories.forEach((c) => catById.set(c.id, c));
    const parents: PublicCategory[] = [];
    const childrenByParent = new Map<string, PublicCategory[]>();
    // Include as "parents" any category that: has no parent OR whose parent is not in used set
    const usedIds = new Set<string>();
    items.forEach((i) => i.product.category_id && usedIds.add(i.product.category_id));
    usedIds.forEach((id) => {
      const cat = catById.get(id);
      if (!cat) return;
      if (cat.parent_id && catById.has(cat.parent_id)) {
        const arr = childrenByParent.get(cat.parent_id) ?? [];
        arr.push(cat);
        childrenByParent.set(cat.parent_id, arr);
      } else {
        parents.push(cat);
      }
    });
    // Add parents of children too
    childrenByParent.forEach((_, parentId) => {
      const p = catById.get(parentId);
      if (p && !parents.find((x) => x.id === parentId)) parents.push(p);
    });
    parents.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return { parents, childrenByParent, catById };
  }, [categories, items]);

  // Apply filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((it) => {
      // Text query
      if (q) {
        const hay = `${it.product.name} ${it.product.description ?? ""} ${it.product.brand ?? ""} ${it.product.subcategory ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // Category
      if (selectedCategories.size > 0) {
        const cid = it.product.category_id;
        if (!cid) return false;
        const cat = catById.get(cid);
        const inSelf = selectedCategories.has(cid);
        const inParent = cat?.parent_id ? selectedCategories.has(cat.parent_id) : false;
        if (!inSelf && !inParent) return false;
      }
      // Price
      const p = priceOf(it);
      if (p < priceRange[0] || p > priceRange[1]) return false;
      // Rating
      if (minRating > 0 && (it.rating ?? 0) < minRating) return false;
      return true;
    });

    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case "price_desc":
        list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case "rating_desc":
        list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "featured":
        list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        break;
      case "relevance":
      default:
        // Default order already: featured first, then display_order
        break;
    }
    return list;
  }, [items, query, selectedCategories, catById, priceRange, minRating, sort]);

  // Suggestions (top 5 by product name / category name match)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return { products: [], cats: [] };
    const products = items
      .filter((i) => i.product.name.toLowerCase().includes(q))
      .slice(0, 5);
    const cats = parents
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 3);
    return { products, cats };
  }, [items, parents, query]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategories(new Set());
    setMinRating(0);
    setPriceRange([priceBounds.min, priceBounds.max]);
    setSort("relevance");
  };

  const activeFilterCount =
    (query ? 1 : 0) +
    selectedCategories.size +
    (minRating > 0 ? 1 : 0) +
    (priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max ? 1 : 0);

  if (loadingStore) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto p-6">
        <EmptyState
          icon={StoreIcon}
          title="Loja não encontrada"
          description="A loja que você procura não existe ou não está publicada."
        />
      </div>
    );
  }

  const FiltersPanel = (
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
          <span>{BRL(priceRange[0], store.currency)}</span>
          <span>{BRL(priceRange[1], store.currency)}</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-sm">Avaliação mínima</h3>
        <RadioGroup
          value={String(minRating)}
          onValueChange={(v) => setMinRating(Number(v))}
        >
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="border-b sticky top-0 z-40 bg-background/95 backdrop-blur"
        style={{ borderColor: store.primary_color + "20" }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/loja/${slug}`)}
            className="flex items-center gap-2 shrink-0"
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-8" />
            ) : (
              <div
                className="h-8 w-8 rounded"
                style={{
                  background: `linear-gradient(135deg, ${store.primary_color}, ${store.secondary_color})`,
                }}
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

            {/* Suggestions dropdown */}
            {suggestOpen && (suggestions.products.length > 0 || suggestions.cats.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg overflow-hidden z-50">
                {suggestions.cats.length > 0 && (
                  <div className="p-2 border-b">
                    <p className="text-[10px] uppercase text-muted-foreground px-2 mb-1">Categorias</p>
                    {suggestions.cats.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => {
                          toggleCategory(c.id);
                          setQuery("");
                        }}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 hover:bg-accent rounded text-sm"
                      >
                        <ChevronRight className="h-3 w-3" /> {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.products.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] uppercase text-muted-foreground px-2 mb-1">Produtos</p>
                    {suggestions.products.map((p) => (
                      <button
                        key={p.id}
                        onMouseDown={() => setQuery(p.product.name)}
                        className="w-full flex items-center gap-3 text-left px-2 py-1.5 hover:bg-accent rounded"
                      >
                        {p.product.image_url ? (
                          <img
                            src={p.product.image_url}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{p.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {BRL(priceOf(p), store.currency)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{FiltersPanel}</div>
            </SheetContent>
          </Sheet>

          <Button
            variant="default"
            size="icon"
            onClick={() => navigate(`/loja/${slug}/checkout`)}
            aria-label="Ir para checkout"
            style={{ backgroundColor: store.primary_color }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Desktop filters */}
        <aside className="hidden lg:block">
          <Card>
            <CardContent className="pt-6">{FiltersPanel}</CardContent>
          </Card>
        </aside>

        <main>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {query ? `Resultados para "${query}"` : "Todos os produtos"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {loadingItems ? "Carregando..." : `${filtered.length} produto(s) encontrado(s)`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-xs text-muted-foreground shrink-0">
                Ordenar:
              </Label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="relevance">Relevância</option>
                <option value="featured">Destaques</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
                <option value="rating_desc">Melhor avaliados</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
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
              {(priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max) && (
                <Badge variant="secondary" className="gap-1">
                  {BRL(priceRange[0], store.currency)} — {BRL(priceRange[1], store.currency)}
                  <button
                    onClick={() => setPriceRange([priceBounds.min, priceBounds.max])}
                    aria-label="Remover preço"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {loadingItems ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum produto encontrado"
              description={
                activeFilterCount > 0
                  ? "Tente ajustar os filtros ou limpar a busca para ver mais opções."
                  : "Esta loja ainda não publicou produtos."
              }
              action={
                activeFilterCount > 0
                  ? { label: "Limpar filtros", onClick: clearFilters }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((it) => {
                const price = priceOf(it);
                const compare = it.compare_at_price;
                const hasDiscount = compare && compare > price;
                return (
                  <Card
                    key={it.id}
                    className="overflow-hidden group hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {it.product.image_url ? (
                        <img
                          src={it.product.image_url}
                          alt={it.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <StoreIcon className="h-12 w-12" />
                        </div>
                      )}
                      {it.is_featured && (
                        <Badge className="absolute top-2 left-2" style={{ backgroundColor: store.primary_color }}>
                          Destaque
                        </Badge>
                      )}
                      {hasDiscount && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                          -{Math.round(((compare! - price) / compare!) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                        {it.product.name}
                      </h3>
                      {it.rating != null && it.rating_count > 0 ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="font-medium">{it.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({it.rating_count})</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Sem avaliações</div>
                      )}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="font-bold text-base">
                          {BRL(price, store.currency)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {BRL(compare!, store.currency)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
