import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageContainer } from "@/shared/components/PageContainer";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Input } from "@/ui/base/input";
import { Label } from "@/ui/base/label";
import { Skeleton } from "@/ui/base/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Check, Sparkles, Store as StoreIcon } from "lucide-react";
import {
  useCommerceThemes,
  useCreateStorefront,
  type CommerceTheme,
} from "@/hooks/useCommerce";
import { toastError } from "@/lib/toastHelpers";

const CATEGORY_LABELS: Record<string, string> = {
  all: "Todas as categorias",
  general: "Geral",
  fashion: "Moda",
  marketplace: "Marketplace",
  electronics: "Eletrônicos",
  agro: "Agro / Alimentos",
  industrial: "Industrial / B2B",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export default function CommerceStorefrontNew() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: themes, isLoading } = useCommerceThemes();
  const create = useCreateStorefront();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<"b2c" | "b2b" | "hybrid">("b2c");
  const [category, setCategory] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "premium">("all");
  const [themeId, setThemeId] = useState<string | null>(params.get("theme"));

  const filtered = useMemo(() => {
    return (themes ?? []).filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (priceFilter === "free" && t.is_premium) return false;
      if (priceFilter === "premium" && !t.is_premium) return false;
      return true;
    });
  }, [themes, category, priceFilter]);

  const canSubmit = name.trim().length >= 2 && slug.trim().length >= 2 && !!themeId;

  const submit = () => {
    if (!canSubmit) {
      toastError("Preencha nome, slug e escolha um layout.");
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        slug: slug.trim(),
        storefront_type: type,
        theme_id: themeId,
      },
      {
        onSuccess: (row) => navigate(`/commerce/lojas/${row.id}`),
      },
    );
  };

  return (
    <RoleGuard roles={["admin", "manager"]}>
      <PageContainer>
        <PageHeader
          title="Nova loja"
          description="Escolha um layout do marketplace e configure os dados básicos."
          onBack={() => navigate("/commerce/lojas")}
        />

        {/* Basic info */}
        <Card>
          <CardContent className="pt-6 grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="name">Nome da loja</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slug || slug === slugify(name)) setSlug(slugify(v));
                }}
                placeholder="Minha Loja"
                maxLength={80}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="minha-loja"
                maxLength={40}
              />
              <p className="text-xs text-muted-foreground">
                {slug || "minha-loja"}.usecommerce.com.br
              </p>
            </div>
            <div className="space-y-1">
              <Label>Tipo de loja</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b2c">B2C (consumidor final)</SelectItem>
                  <SelectItem value="b2b">B2B (empresas)</SelectItem>
                  <SelectItem value="hybrid">Híbrida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme gallery */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold">
              Escolha um layout {themeId && <Badge className="ml-2">Selecionado</Badge>}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
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
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded border p-8 text-center text-sm text-muted-foreground">
              Nenhum layout encontrado com esses filtros.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  selected={themeId === t.id}
                  onSelect={() => setThemeId(t.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {themeId ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4 text-emerald-500" /> Layout selecionado
              </span>
            ) : (
              "Selecione um layout para continuar"
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/commerce/lojas")}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={!canSubmit || create.isPending}>
              <StoreIcon className="h-4 w-4 mr-1" />
              {create.isPending ? "Criando..." : "Criar loja"}
            </Button>
          </div>
        </div>
      </PageContainer>
    </RoleGuard>
  );
}

function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: CommerceTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg border overflow-hidden transition-all hover:shadow-lg ${
        selected ? "ring-2 ring-primary border-primary" : "border-border"
      }`}
    >
      <div
        className="aspect-video w-full"
        style={{
          background:
            theme.category === "fashion"
              ? "linear-gradient(135deg, #1a1a1a, #666666)"
              : theme.category === "electronics"
                ? "linear-gradient(135deg, #0f172a, #3b82f6)"
                : theme.category === "agro"
                  ? "linear-gradient(135deg, #14532d, #a3e635)"
                  : theme.category === "industrial"
                    ? "linear-gradient(135deg, #292524, #f59e0b)"
                    : theme.category === "marketplace"
                      ? "linear-gradient(135deg, #ec4899, #f59e0b)"
                      : "linear-gradient(135deg, #1A2234, #FF9800)",
        }}
      />
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium flex items-center gap-1">
              {theme.name}
              {theme.is_premium && (
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              por {theme.author ?? "Anônimo"}
            </p>
          </div>
          <Badge variant={theme.is_premium ? "default" : "secondary"}>
            {theme.is_premium ? `R$ ${theme.price.toFixed(0)}` : "Grátis"}
          </Badge>
        </div>
        {theme.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {theme.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {theme.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </button>
  );
}
