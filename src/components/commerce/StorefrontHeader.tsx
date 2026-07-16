import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Store as StoreIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import { Badge } from "@/ui/base/badge";
import { useStorefrontCart } from "@/hooks/useStorefrontCart";
import type { PublicStorefront } from "@/hooks/useStorefrontSearch";
import { CartDrawer } from "./CartDrawer";

interface Props {
  storefront: PublicStorefront;
}

export function StorefrontHeader({ storefront }: Props) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useStorefrontCart(storefront.slug);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    navigate(`/loja/${storefront.slug}/busca${params}`);
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
        style={{ borderColor: `${storefront.primary_color}20` }}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <Link
            to={`/loja/${storefront.slug}`}
            className="flex items-center gap-2 font-semibold shrink-0"
            style={{ color: storefront.primary_color }}
          >
            {storefront.logo_url ? (
              <img src={storefront.logo_url} alt={storefront.name} className="h-8 w-8 rounded" />
            ) : (
              <StoreIcon className="h-6 w-6" />
            )}
            <span className="hidden sm:inline">{storefront.name}</span>
          </Link>

          <form onSubmit={submitSearch} className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produtos, marcas e categorias..."
              className="pl-9"
            />
          </form>

          <Button
            variant="outline"
            size="sm"
            className="relative gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {totalItems > 0 && (
              <Badge
                className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-[10px]"
                style={{ backgroundColor: storefront.secondary_color, color: "white" }}
              >
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </header>
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        storefront={storefront}
      />
    </>
  );
}
