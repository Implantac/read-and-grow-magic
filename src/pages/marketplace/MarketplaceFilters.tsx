import { Search } from "lucide-react";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";
import type { PriceFilter, SortMode } from "./constants";
import { CATEGORY_LABEL } from "./constants";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  price: PriceFilter;
  onPrice: (v: PriceFilter) => void;
  minRating: number;
  onMinRating: (v: number) => void;
  sort: SortMode;
  onSort: (v: SortMode) => void;
  category: string;
  onCategory: (v: string) => void;
  categories: string[];
  hasActiveFilters: boolean;
  onClear: () => void;
  filteredCount: number;
  totalCount: number;
}

export function MarketplaceFilters({
  search, onSearch, price, onPrice, minRating, onMinRating, sort, onSort,
  category, onCategory, categories, hasActiveFilters, onClear, filteredCount, totalCount,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição, fornecedor..."
            className="pl-9"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={price} onValueChange={(v) => onPrice(v as PriceFilter)}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Preço" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os preços</SelectItem>
              <SelectItem value="free">Gratuitos</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(minRating)} onValueChange={(v) => onMinRating(Number(v))}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Avaliação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Qualquer nota</SelectItem>
              <SelectItem value="3">3★ ou mais</SelectItem>
              <SelectItem value="4">4★ ou mais</SelectItem>
              <SelectItem value="5">5★</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => onSort(v as SortMode)}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="top_rated">Melhor avaliados</SelectItem>
              <SelectItem value="newest">Nome A–Z</SelectItem>
              <SelectItem value="price_asc">Preço: menor</SelectItem>
              <SelectItem value="price_desc">Preço: maior</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear}>Limpar</Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => onCategory(c)}
          >
            {CATEGORY_LABEL[c] ?? c}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredCount} de {totalCount} plugin{totalCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
