import { Star, Store as StoreIcon } from "lucide-react";
import { Card, CardContent } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import type { StorefrontSearchItem } from "@/hooks/useStorefrontSearch";
import { BRL, priceOf } from "./utils";

interface ProductCardProps {
  item: StorefrontSearchItem;
  primaryColor: string;
  currency: string;
}

export function ProductCard({ item, primaryColor, currency }: ProductCardProps) {
  const price = priceOf(item);
  const compare = item.compare_at_price;
  const hasDiscount = compare && compare > price;
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <StoreIcon className="h-12 w-12" />
          </div>
        )}
        {item.is_featured && (
          <Badge className="absolute top-2 left-2" style={{ backgroundColor: primaryColor }}>
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
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{item.product.name}</h3>
        {item.rating != null && item.rating_count > 0 ? (
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span className="font-medium">{item.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({item.rating_count})</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Sem avaliações</div>
        )}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-bold text-base">{BRL(price, currency)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {BRL(compare!, currency)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
