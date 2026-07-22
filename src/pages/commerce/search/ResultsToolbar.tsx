import { Label } from "@/ui/base/label";
import type { SortKey, ViewMode } from "./utils";

type Props = {
  query: string;
  loadingItems: boolean;
  totalCount: number;
  sort: SortKey; setSort: (v: SortKey) => void;
  perPage: number; setPerPage: (v: number) => void;
  viewMode: ViewMode; setViewMode: (v: ViewMode) => void;
};

export function ResultsToolbar({
  query, loadingItems, totalCount, sort, setSort, perPage, setPerPage, viewMode, setViewMode,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold">
          {query ? `Resultados para "${query}"` : "Todos os produtos"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {loadingItems ? "Carregando..." : `${totalCount} produto(s) encontrado(s)`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="sort" className="text-xs text-muted-foreground shrink-0">Ordenar:</Label>
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

        <Label htmlFor="perpage" className="text-xs text-muted-foreground shrink-0 ml-1">Por página:</Label>
        <select
          id="perpage"
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="h-9 rounded-md border bg-background px-2 text-sm"
          aria-label="Itens por página"
        >
          {[12, 24, 36, 48].map((n) => <option key={n} value={n}>{n}</option>)}
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
  );
}
