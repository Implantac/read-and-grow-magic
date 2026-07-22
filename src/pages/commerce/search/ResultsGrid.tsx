import { Loader2, Search } from "lucide-react";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { ProductCard } from "./ProductCard";
import { PaginationControls } from "./PaginationControls";
import type { StorefrontSearchItem } from "@/hooks/useStorefrontSearch";
import type { ViewMode } from "./utils";
import type { Dispatch, RefObject, SetStateAction } from "react";

type Props = {
  loadingItems: boolean;
  filteredCount: number;
  visibleItems: StorefrontSearchItem[];
  activeFilterCount: number;
  clearFilters: () => void;
  primaryColor: string;
  currency: string;
  viewMode: ViewMode;
  hasMoreInfinite: boolean;
  sentinelRef: RefObject<HTMLDivElement>;
  page: number; totalPages: number; perPage: number; setPage: Dispatch<SetStateAction<number>>;
};

export function ResultsGrid({
  loadingItems, filteredCount, visibleItems, activeFilterCount, clearFilters,
  primaryColor, currency, viewMode, hasMoreInfinite, sentinelRef,
  page, totalPages, perPage, setPage,
}: Props) {
  if (loadingItems) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Nenhum produto encontrado"
        description={
          activeFilterCount > 0
            ? "Tente ajustar os filtros ou limpar a busca para ver mais opções."
            : "Esta loja ainda não publicou produtos."
        }
        action={activeFilterCount > 0 ? { label: "Limpar filtros", onClick: clearFilters } : undefined}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleItems.map((it) => (
          <ProductCard key={it.id} item={it} primaryColor={primaryColor} currency={currency} />
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
              Você chegou ao fim — {filteredCount} produto(s) exibido(s).
            </p>
          )}
        </div>
      )}

      {viewMode === "pagination" && totalPages > 1 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          total={filteredCount}
          setPage={setPage}
          goToPage={(n) => setPage(n)}
        />
      )}
    </>
  );
}
