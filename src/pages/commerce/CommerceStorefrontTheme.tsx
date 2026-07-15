import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Skeleton } from "@/ui/base/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Check, Sparkles } from "lucide-react";
import {
  useStorefront,
  useCommerceThemes,
  useUpdateStorefrontTheme,
} from "@/hooks/useCommerce";

export default function CommerceStorefrontTheme() {
  const { storefrontId = "" } = useParams<{ storefrontId: string }>();
  const navigate = useNavigate();
  const { data: storefront } = useStorefront(storefrontId);
  const { data: themes, isLoading } = useCommerceThemes();
  const update = useUpdateStorefrontTheme();

  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "premium">("all");
  const [selected, setSelected] = useState<string | null>(
    storefront?.theme_id ?? null,
  );

  const filtered = (themes ?? []).filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (priceFilter === "free" && t.is_premium) return false;
    if (priceFilter === "premium" && !t.is_premium) return false;
    return true;
  });

  const apply = () => {
    if (!selected) return;
    update.mutate(
      { id: storefrontId, theme_id: selected },
      { onSuccess: () => navigate(`/commerce/lojas/${storefrontId}`) },
    );
  };

  return (
    <RoleGuard roles={["admin", "manager"]}>
      <PageContainer>
        <PageHeader
          title="Trocar layout"
          description={`Selecione um novo layout para ${storefront?.name ?? "esta loja"}.`}
          onBack={() => navigate(`/commerce/lojas/${storefrontId}`)}
        />

        <div className="flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="general">Geral</SelectItem>
              <SelectItem value="fashion">Moda</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="electronics">Eletrônicos</SelectItem>
              <SelectItem value="agro">Agro / Alimentos</SelectItem>
              <SelectItem value="industrial">Industrial / B2B</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priceFilter}
            onValueChange={(v) => setPriceFilter(v as typeof priceFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os preços</SelectItem>
              <SelectItem value="free">Gratuitos</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-all ${
                  selected === t.id
                    ? "ring-2 ring-primary border-primary"
                    : ""
                }`}
                onClick={() => setSelected(t.id)}
              >
                <div
                  className="aspect-video w-full rounded-t-lg"
                  style={{
                    background:
                      t.category === "fashion"
                        ? "linear-gradient(135deg, #1a1a1a, #666666)"
                        : t.category === "electronics"
                          ? "linear-gradient(135deg, #0f172a, #3b82f6)"
                          : t.category === "agro"
                            ? "linear-gradient(135deg, #14532d, #a3e635)"
                            : t.category === "industrial"
                              ? "linear-gradient(135deg, #292524, #f59e0b)"
                              : t.category === "marketplace"
                                ? "linear-gradient(135deg, #ec4899, #f59e0b)"
                                : "linear-gradient(135deg, #1A2234, #FF9800)",
                  }}
                />
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium flex items-center gap-1">
                      {t.name}
                      {t.is_premium && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <Badge variant={t.is_premium ? "default" : "secondary"}>
                      {t.is_premium ? `R$ ${t.price.toFixed(0)}` : "Grátis"}
                    </Badge>
                  </div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {selected ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-emerald-500" /> Novo layout selecionado
              </span>
            ) : (
              "Selecione um layout"
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/commerce/lojas/${storefrontId}`)}
            >
              Cancelar
            </Button>
            <Button
              onClick={apply}
              disabled={!selected || selected === storefront?.theme_id || update.isPending}
            >
              {update.isPending ? "Aplicando..." : "Aplicar layout"}
            </Button>
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}
