import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { StorefrontSearchItem, PublicCategory } from "@/hooks/useStorefrontSearch";
import { priceOf, type SortKey, type ViewMode } from "./utils";

export function useStorefrontFilters(items: StorefrontSearchItem[], categories: PublicCategory[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(searchParams.getAll("cat"))
  );
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get("rating") ?? 0));
  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) ?? "relevance");
  const [suggestOpen, setSuggestOpen] = useState(false);

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
      case "price_asc": list = [...list].sort((a, b) => priceOf(a) - priceOf(b)); break;
      case "price_desc": list = [...list].sort((a, b) => priceOf(b) - priceOf(a)); break;
      case "rating_desc": list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case "featured": list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)); break;
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
    if (viewMode === "infinite") return filtered.slice(0, Math.min(infiniteCount, filtered.length));
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

  return {
    query, setQuery,
    selectedCategories, toggleCategory,
    minRating, setMinRating,
    sort, setSort,
    suggestOpen, setSuggestOpen,
    viewMode, setViewMode,
    perPage, setPerPage,
    page, setPage,
    infiniteCount, sentinelRef,
    priceBounds, priceRange, setPriceRange,
    parents, childrenByParent, catById,
    filtered, totalPages, visibleItems, hasMoreInfinite,
    suggestions, clearFilters, activeFilterCount,
  };
}
