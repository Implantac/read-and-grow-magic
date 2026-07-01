import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Input } from "@/ui/base/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/base/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/base/dialog";
import { Label } from "@/ui/base/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/base/select";
import { Badge } from "@/ui/base/badge";
import { EmptyState } from "@/shared/components/EmptyState";
import { History } from "lucide-react";
import { Plus, Trash2, Package, Hammer } from "lucide-react";
import { toastSuccess, toastError } from "@/lib/toastHelpers";

type Product = { id: string; code: string; name: string };
type KitRow = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  parent_product_id: string;
  parent?: Product | null;
  components?: Array<{ id: string; component_product_id: string; quantity: number; product?: Product | null }>;
};
type Assembly = {
  id: string;
  kit_id: string;
  quantity: number;
  status: string;
  created_at: string;
  kit?: { code: string; name: string } | null;
};

export default function KitAssembly() {
  const [kits, setKits] = useState<KitRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [openAssemble, setOpenAssemble] = useState<KitRow | null>(null);

  // New kit form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [components, setComponents] = useState<Array<{ product_id: string; quantity: number }>>([]);

  // Assemble form
  const [qty, setQty] = useState<number>(1);

  async function load() {
    setLoading(true);
    const [{ data: prods }, { data: kitData }, { data: comps }, { data: asms }] = await Promise.all([
      supabase.from("products").select("id, code, name").order("name").limit(500),
      supabase.from("wms_kits").select("*").order("created_at", { ascending: false }),
      supabase.from("wms_kit_components").select("*"),
      supabase
        .from("wms_kit_assemblies")
        .select("*, kit:wms_kits(code, name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const productMap = new Map((prods ?? []).map((p) => [p.id, p]));
    setProducts(prods ?? []);
    setKits(
      (kitData ?? []).map((k: any) => ({
        ...k,
        parent: productMap.get(k.parent_product_id) ?? null,
        components: (comps ?? [])
          .filter((c: any) => c.kit_id === k.id)
          .map((c: any) => ({ ...c, product: productMap.get(c.component_product_id) ?? null })),
      })),
    );
    setAssemblies((asms ?? []) as any);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function resetNew() {
    setCode("");
    setName("");
    setParentId("");
    setComponents([]);
  }

  async function createKit() {
    if (!code || !name || !parentId || components.length === 0) {
      toastError("Preencha código, nome, SKU pai e ao menos 1 componente.");
      return;
    }
    const { data: companyId } = await supabase.rpc("get_user_company_id", {
      _user_id: (await supabase.auth.getUser()).data.user?.id,
    });
    if (!companyId) {
      toastError("Empresa não identificada.");
      return;
    }
    const { data: kit, error } = await supabase
      .from("wms_kits")
      .insert({ code, name, parent_product_id: parentId, company_id: companyId })
      .select()
      .single();
    if (error || !kit) {
      toastError(`Falha ao criar kit: ${error?.message ?? ""}`);
      return;
    }
    const { error: cerr } = await supabase.from("wms_kit_components").insert(
      components.map((c) => ({
        kit_id: kit.id,
        company_id: companyId,
        component_product_id: c.product_id,
        quantity: c.quantity,
      })),
    );
    if (cerr) {
      toastError(`Componentes: ${cerr.message}`);
      return;
    }
    toastSuccess("Kit cadastrado.");
    setOpenNew(false);
    resetNew();
    void load();
  }

  async function assemble() {
    if (!openAssemble) return;
    if (qty <= 0) {
      toastError("Quantidade inválida.");
      return;
    }
    const { error } = await supabase.rpc("wms_assemble_kit", {
      p_kit_id: openAssemble.id,
      p_quantity: qty,
    });
    if (error) {
      toastError(`Falha na montagem: ${error.message}`);
      return;
    }
    toastSuccess(`${qty}x ${openAssemble.code} montado.`);
    setOpenAssemble(null);
    setQty(1);
    void load();
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Montagem de Kits (VAS)
          </h1>
          <p className="text-muted-foreground">
            Cadastre kits com seus componentes e execute montagens consumindo estoque por tenant.
          </p>
        </div>
        <Dialog open={openNew} onOpenChange={(v) => (v ? setOpenNew(true) : (setOpenNew(false), resetNew()))}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Novo Kit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Kit</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código</Label>
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="KIT-001" />
                </div>
                <div>
                  <Label>Nome</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kit Promocional" />
                </div>
              </div>
              <div>
                <Label>SKU Pai</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto pai" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Componentes</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setComponents((c) => [...c, { product_id: "", quantity: 1 }])}
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {components.map((c, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Select
                        value={c.product_id}
                        onValueChange={(v) =>
                          setComponents((arr) => arr.map((it, i) => (i === idx ? { ...it, product_id: v } : it)))
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Componente" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.code} — {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        value={c.quantity}
                        onChange={(e) =>
                          setComponents((arr) =>
                            arr.map((it, i) => (i === idx ? { ...it, quantity: Number(e.target.value) } : it)),
                          )
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setComponents((arr) => arr.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {components.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum componente adicionado.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenNew(false)}>
                Cancelar
              </Button>
              <Button onClick={createKit}>Salvar Kit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Kits Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando…</p>
          ) : kits.length === 0 ? (
            <EmptyState
              compact
              icon={Package}
              title="Nenhum kit cadastrado"
              description="Cadastre kits para agrupar componentes em SKUs pai montáveis."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU Pai</TableHead>
                  <TableHead>Componentes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kits.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-mono">{k.code}</TableCell>
                    <TableCell>{k.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.parent ? `${k.parent.code} — ${k.parent.name}` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(k.components ?? []).map((c) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">
                            {c.product?.code ?? "?"} × {c.quantity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={k.active ? "default" : "outline"}>{k.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setOpenAssemble(k)}>
                        <Hammer className="h-4 w-4" /> Montar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Montagens</CardTitle>
        </CardHeader>
        <CardContent>
          {assemblies.length === 0 ? (
            <EmptyState
              compact
              icon={History}
              title="Nenhuma montagem registrada"
              description="As montagens realizadas aparecerão aqui com data, kit e quantidade."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Kit</TableHead>
                  <TableHead>Qtde</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assemblies.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{new Date(a.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      {a.kit?.code} — {a.kit?.name}
                    </TableCell>
                    <TableCell>{a.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "completed" ? "default" : "outline"}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openAssemble} onOpenChange={(v) => !v && setOpenAssemble(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Montar Kit — {openAssemble?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Será consumida a BOM × quantidade abaixo e gerado o SKU pai no estoque.
            </p>
            <div>
              <Label>Quantidade a montar</Label>
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div className="rounded border p-3 bg-muted/30 space-y-1">
              <p className="text-xs font-medium">Consumo previsto:</p>
              {(openAssemble?.components ?? []).map((c) => (
                <div key={c.id} className="text-xs flex justify-between">
                  <span>{c.product?.code ?? "?"} — {c.product?.name ?? ""}</span>
                  <span className="font-mono">{c.quantity * qty}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssemble(null)}>
              Cancelar
            </Button>
            <Button onClick={assemble}>Confirmar Montagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
