import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Loader2, Plus } from "lucide-react";
import type { PluginRow } from "./types";

interface Props {
  plugins: PluginRow[] | undefined;
  isLoading: boolean;
  selectedId: string | "new" | null;
  onSelect: (id: string | "new") => void;
}

export function PluginList({ plugins, isLoading, selectedId, onSelect }: Props) {
  return (
    <Card className="self-start">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">Plugins</CardTitle>
        <Button size="sm" variant="outline" onClick={() => onSelect("new")} aria-label="Novo plugin">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-2 max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (plugins ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum plugin cadastrado.</p>
        ) : (
          <ul className="space-y-1">
            {plugins!.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedId === p.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{p.name}</span>
                    {!p.is_published && (
                      <Badge variant="outline" className="text-[10px]">rascunho</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.key} · v{p.version}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
