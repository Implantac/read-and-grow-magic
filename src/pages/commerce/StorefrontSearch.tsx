import { useNavigate, useParams } from "react-router-dom";
import { Store as StoreIcon } from "lucide-react";
import { Card, CardContent } from "@/ui/base/card";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  usePublicStorefrontBySlug,
  useStorefrontSearchItems,
  useStorefrontCategories,
} from "@/hooks/useStorefrontSearch";
import { FiltersPanel } from "./search/FiltersPanel";
import { StorefrontHeader } from "./search/StorefrontHeader";
import { ResultsToolbar } from "./search/ResultsToolbar";
import { ActiveFilterChips } from "./search/ActiveFilterChips";
import { ResultsGrid } from "./search/ResultsGrid";
import { useStorefrontFilters } from "./search/useStorefrontFilters";

export default function StorefrontSearch() {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: store, isLoading: loadingStore } = usePublicStorefrontBySlug(slug);
  const { data: items = [], isLoading: loadingItems } = useStorefrontSearchItems(store?.id);
  const { data: categories = [] } = useStorefrontCategories(items);

  const f = useStorefrontFilters(items, categories);

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
      parents={f.parents}
      childrenByParent={f.childrenByParent}
      selectedCategories={f.selectedCategories}
      toggleCategory={f.toggleCategory}
      priceBounds={f.priceBounds}
      priceRange={f.priceRange}
      setPriceRange={f.setPriceRange}
      minRating={f.minRating}
      setMinRating={f.setMinRating}
      currency={store.currency}
      activeFilterCount={f.activeFilterCount}
      clearFilters={f.clearFilters}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader
        store={store}
        slug={slug}
        query={f.query}
        setQuery={f.setQuery}
        suggestOpen={f.suggestOpen}
        setSuggestOpen={f.setSuggestOpen}
        suggestions={f.suggestions}
        toggleCategory={f.toggleCategory}
        activeFilterCount={f.activeFilterCount}
        filtersPanel={filtersPanel}
        onLogoClick={() => navigate(`/loja/${slug}`)}
        onCartClick={() => navigate(`/loja/${slug}/checkout`)}
      />

      <div className="container mx-auto px-4 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="hidden lg:block">
          <Card>
            <CardContent className="pt-6">{filtersPanel}</CardContent>
          </Card>
        </aside>

        <main>
          <ResultsToolbar
            query={f.query}
            loadingItems={loadingItems}
            totalCount={f.filtered.length}
            sort={f.sort}
            setSort={f.setSort}
            perPage={f.perPage}
            setPerPage={f.setPerPage}
            viewMode={f.viewMode}
            setViewMode={f.setViewMode}
          />

          {f.activeFilterCount > 0 && (
            <ActiveFilterChips
              selectedCategories={f.selectedCategories}
              catById={f.catById}
              toggleCategory={f.toggleCategory}
              minRating={f.minRating}
              setMinRating={f.setMinRating}
              priceRange={f.priceRange}
              setPriceRange={f.setPriceRange}
              priceBounds={f.priceBounds}
              currency={store.currency}
            />
          )}

          <ResultsGrid
            loadingItems={loadingItems}
            filteredCount={f.filtered.length}
            visibleItems={f.visibleItems}
            activeFilterCount={f.activeFilterCount}
            clearFilters={f.clearFilters}
            primaryColor={store.primary_color}
            currency={store.currency}
            viewMode={f.viewMode}
            hasMoreInfinite={f.hasMoreInfinite}
            sentinelRef={f.sentinelRef}
            page={f.page}
            totalPages={f.totalPages}
            perPage={f.perPage}
            setPage={f.setPage}
          />
        </main>
      </div>
    </div>
  );
}
