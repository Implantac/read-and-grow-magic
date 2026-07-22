import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { GitBranch, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PluginVersionRow } from "./types";

interface Props {
  versions: PluginVersionRow[] | undefined;
  draftVersion: string;
  isPending: boolean;
  disabled: boolean;
  onPublish: () => void;
}

export function VersionsPanel({ versions, draftVersion, isPending, disabled, onPublish }: Props) {
  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GitBranch className="h-4 w-4 text-primary" />
          Versões publicadas
          <Badge variant="outline" className="text-[10px]">{versions?.length ?? 0}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={onPublish} disabled={isPending || disabled}>
          <Upload className="h-4 w-4 mr-1" />
          Publicar versão {draftVersion}
        </Button>
      </div>
      {(versions?.length ?? 0) === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nenhuma versão publicada ainda. Tenants seguem o script atual.
        </p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-2">
          {versions!.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-3 text-xs">
              <div>
                <span className="font-mono font-semibold">v{v.version}</span>
                {v.changelog && (
                  <span className="text-muted-foreground"> — {v.changelog}</span>
                )}
              </div>
              <span className="text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(v.published_at), { addSuffix: true, locale: ptBR })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
