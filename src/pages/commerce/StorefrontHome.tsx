import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { Star, ShoppingBag, Sparkles, Tag } from "lucide-react";
import {
  usePublicStorefrontBySlug,
  useStorefrontSearchItems,
  useStorefrontCategories,
  type StorefrontSearchItem,
} from "@/hooks/useStorefrontSearch";
import { StorefrontHeader } from "@/components/commerce/StorefrontHeader";
import { Card, CardContent } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { Button } from "@/ui/base/button";
import { Skeleton } from "@/ui/base/skeleton";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatBRL } from "@/lib/formatters";
import { useStorefrontCart } from "@/hooks/useStorefrontCart";
import { Store as StoreIcon } from "lucide-react";

function priceFor(item: StorefrontSearchItem): number {
  return item.public_price ?? item.product.sale_price ?? 0;
}

export default function StorefrontHome() {
  const { slug } = useParams<{ slug: string }>();
  const { data: storefront, isLoading, error } = usePublicStorefrontBySlug(slug);
  const { data: items = [], isLoading: itemsLoading } = useStorefrontSearchItems(
    storefront?.id,
  );
  const { data: categories = [] } = useStorefrontCategories(items);
  const { addItem } = useStorefrontCart(slug);

  const featured = useMemo(() => items.filter((i) => i.is_featured).slice(0, 8), [items]);
  const topRated = useMemo(
    () =>
      [...items]
        .filter((i) => (i.rating ?? 0) >= 4)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 8),
    [items],
  );
  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parent_id).slice(0, 8),
    [categories],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={StoreIcon}
          title="Loja indisponível"
          description="Esta loja não existe ou ainda não está publicada."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StorefrontHeader storefront={storefront} />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${storefront.primary_color}, ${storefront.secondary_color})`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 text-white">
          <Badge className="bg-white/20 text-white border-0 mb-4">
            <Sparkles className="h-3 w-3 mr-1" /> Loja oficial
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold max-w-2xl">
            Bem-vindo à {storefront.name}
          </h1>
          <p className="mt-3 text-white/80 max-w-xl">
            Explore nossa seleção de produtos com entrega rápida e pagamento seguro.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white text-foreground hover:bg-white/90"
            >
              <Link to={`/loja/${storefront.slug}/busca`}>
                <ShoppingBag className="h-4 w-4 mr-2" /> Ver todos os produtos
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      {parentCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="text-xl font-semibold mb-4">Categorias</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {parentCategories.map((c) => (
              <Link
                key={c.id}
                to={`/loja/${storefront.slug}/busca?category=${c.id}`}
                className="group rounded-lg border p-4 hover:border-primary transition-all"
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${storefront.primary_color}15` }}
                >
                  <Tag className="h-5 w-5" style={{ color: storefront.primary_color }} />
                </div>
                <div className="font-medium text-sm group-hover:text-primary">
                  {c.name}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <ProductRow
        title="Destaques"
        items={featured}
        slug={storefront.slug}
        loading={itemsLoading}
        onAdd={(i) =>
          addItem({
            product_id: i.product.id,
            storefront_product_id: i.id,
            product_name: i.product.name,
            unit_price: priceFor(i),
            image_url: i.product.image_url,
          })
        }
        accent={storefront.primary_color}
      />

      {/* Top Rated */}
      {topRated.length > 0 && (
        <ProductRow
          title="Mais bem avaliados"
          items={topRated}
          slug={storefront.slug}
          loading={false}
          onAdd={(i) =>
            addItem({
              product_id: i.product.id,
              storefront_product_id: i.id,
              product_name: i.product.name,
              unit_price: priceFor(i),
              image_url: i.product.image_url,
            })
          }
          accent={storefront.primary_color}
        />
      )}

      <footer className="border-t mt-12 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {storefront.name}. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function ProductRow({
  title,
  items,
  slug,
  loading,
  onAdd,
  accent,
}: {
  title: string;
  items: StorefrontSearchItem[];
  slug: string;
  loading: boolean;
  onAdd: (i: StorefrontSearchItem) => void;
  accent: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          to={`/loja/${slug}/busca`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Ver todos →
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum produto disponível.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              slug={slug}
              onAdd={() => onAdd(item)}
              accent={accent}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function ProductCard({
  item,
  slug,
  onAdd,
  accent,
}: {
  item: StorefrontSearchItem;
  slug: string;
  onAdd: () => void;
  accent: string;
}) {
  const price = priceFor(item);
  const hasDiscount =
    item.compare_at_price && item.compare_at_price > price;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all">
      <Link to={`/loja/${slug}/produto/${item.id}`} className="block">
        <div className="aspect-square bg-muted overflow-hidden">
          {item.product.image_url ? (
            <img
              src={item.product.image_url}
              alt={item.product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-3 space-y-2">
        <Link to={`/loja/${slug}/produto/${item.id}`}>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary">
            {item.product.name}
          </h3>
        </Link>
        {item.rating != null && item.rating > 0 && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{item.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({item.rating_count})</span>
          </div>
        )}
        <div>
          {hasDiscount && (
            <div className="text-xs text-muted-foreground line-through">
              {formatBRL(item.compare_at_price!)}
            </div>
          )}
          <div className="text-lg font-bold" style={{ color: accent }}>
            {formatBRL(price)}
          </div>
        </div>
        <Button size="sm" className="w-full" onClick={onAdd}>
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}
