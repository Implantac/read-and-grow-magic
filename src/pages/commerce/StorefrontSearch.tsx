import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Star, Store as StoreIcon, ShoppingCart, Loader2 } from "lucide-react";
import { Input } from "@/ui/base/input";
import { Button } from "@/ui/base/button";
import { Card, CardContent } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import { Label } from "@/ui/base/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/base/sheet";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  usePublicStorefrontBySlug,
  useStorefrontSearchItems,
  useStorefrontCategories,
  type PublicCategory,
} from "@/hooks/useStorefrontSearch";
import { FiltersPanel } from "./search/FiltersPanel";
import { ProductCard } from "./search/ProductCard";
import { PaginationControls } from "./search/PaginationControls";
import { SearchSuggestions } from "./search/SearchSuggestions";
import { BRL, priceOf, type SortKey, type ViewMode } from "./search/utils";

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
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get("rating") ?? 0));
  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) ?? "relevance");
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Pagination / infinite scroll
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) ?? "pagination"
  );
  const [perPage, setPerPage] = useState<number>(Number(searchParams.get("pp") ?? 12));
  const [page, setPage] = useState<number>(Math.max(1, Number(searchParams.get("page") ?? 1)));
  const [infiniteCount, setInfiniteCount] = useState<number>(perPage);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const priceBounds = useMemo(() => {
    if (!items.length) return { min: 0, max: 1000 };
    const prices = items.map(priceOf);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [items]);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("pmin") ?? priceBounds.min),
    Number(searchParams.get("pmax") ?? priceBounds.max),
  ]);

  useEffect(() => {
    if (!searchParams.get("pmin") && !searchParams.get("pmax")) {
      setPriceRange([priceBounds.min, priceBounds.max]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceBounds.min, priceBounds.max]);

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

  const { parents, childrenByParent, catById } = useMemo(() => {
    const catById = new Map<string, PublicCategory>();
    categories.forEach((c) => catById.set(c.id, c));
    const parents: PublicCategory[] = [];
    const childrenByParent = new Map<string, PublicCategory[]>();
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
    childrenByParent.forEach((_, parentId) => {
      const p = catById.get(parentId);
      if (p && !parents.find((x) => x.id === parentId)) parents.push(p);
    });
    parents.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return { parents, childrenByParent, catById };
  }, [categories, items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((it) => {
      if (q) {
        const hay = `${it.product.name} ${it.product.description ?? ""} ${it.product.brand ?? ""} ${it.product.subcategory ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCategories.size > 0) {
        const cid = it.product.category_id;
        if (!cid) return false;
        const cat = catById.get(cid);
        const inSelf = selectedCategories.has(cid);
        const inParent = cat?.parent_id ? selectedCategories.has(cat.parent_id) : false;
        if (!inSelf && !inParent) return false;
      }
      const p = priceOf(it);
      if (p < priceRange[0] || p > priceRange[1]) return false;
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
    }
    return list;
  }, [items, query, selectedCategories, catById, priceRange, minRating, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    setPage(1);
    setInfiniteCount(perPage);
  }, [query, selectedCategories, priceRange, minRating, sort, perPage, viewMode]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("view", viewMode);
    params.set("pp", String(perPage));
    if (viewMode === "pagination" && page > 1) params.set("page", String(page));
    else params.delete("page");
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, perPage, page]);

  const visibleItems = useMemo(() => {
    if (viewMode === "infinite") {
      return filtered.slice(0, Math.min(infiniteCount, filtered.length));
    }
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, viewMode, infiniteCount, page, perPage]);

  const hasMoreInfinite = viewMode === "infinite" && infiniteCount < filtered.length;

  useEffect(() => {
    if (viewMode !== "infinite") return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && infiniteCount < filtered.length) {
          setInfiniteCount((c) => Math.min(c + perPage, filtered.length));
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [viewMode, infiniteCount, filtered.length, perPage]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return { products: [], cats: [] };
    const products = items.filter((i) => i.product.name.toLowerCase().includes(q)).slice(0, 5);
    const cats = parents.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3);
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

  const filtersPanel = (
    <FiltersPanel
      parents={parents}
      childrenByParent={childrenByParent}
      selectedCategories={selectedCategories}
      toggleCategory={toggleCategory}
      priceBounds={priceBounds}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      minRating={minRating}
      setMinRating={setMinRating}
      currency={store.currency}
      activeFilterCount={activeFilterCount}
      clearFilters={clearFilters}
    />
  );

  return (
    <div className="min-h-screen bg-background">
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

            {suggestOpen && (
              <SearchSuggestions
                products={suggestions.products}
                cats={suggestions.cats}
                currency={store.currency}
                onSelectCategory={(id) => {
                  toggleCategory(id);
                  setQuery("");
                }}
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
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filtersPanel}</div>
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
        <aside className="hidden lg:block">
          <Card>
            <CardContent className="pt-6">{filtersPanel}</CardContent>
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

            <div className="flex flex-wrap items-center gap-2">
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

              <Label htmlFor="perpage" className="text-xs text-muted-foreground shrink-0 ml-1">
                Por página:
              </Label>
              <select
                id="perpage"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="h-9 rounded-md border bg-background px-2 text-sm"
                aria-label="Itens por página"
              >
                {[12, 24, 36, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <div className="inline-flex rounded-md border overflow-hidden" role="tablist" aria-label="Modo de exibição">
                <button
                  type="button"
                  onClick={() => setViewMode("pagination")}
                  className={`px-2.5 h-9 text-xs ${viewMode === "pagination" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                  aria-pressed={viewMode === "pagination"}
                >
                  Páginas
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("infinite")}
                  className={`px-2.5 h-9 text-xs border-l ${viewMode === "infinite" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                  aria-pressed={viewMode === "infinite"}
                >
                  Rolagem
                </button>
              </div>
            </div>
          </div>

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
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleItems.map((it) => (
                  <ProductCard
                    key={it.id}
                    item={it}
                    primaryColor={store.primary_color}
                    currency={store.currency}
                  />
                ))}
              </div>

              {viewMode === "infinite" && (
                <div className="mt-6 flex flex-col items-center gap-2" aria-live="polite">
                  {hasMoreInfinite ? (
                    <>
                      <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando mais produtos...
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground py-4">
                      Você chegou ao fim — {filtered.length} produto(s) exibido(s).
                    </p>
                  )}
                </div>
              )}

              {viewMode === "pagination" && totalPages > 1 && (
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  perPage={perPage}
                  total={filtered.length}
                  setPage={setPage}
                  goToPage={(n) => setPage(n)}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
