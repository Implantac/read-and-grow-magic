import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/base/dialog";
import { Button } from "@/ui/base/button";
import { Badge } from "@/ui/base/badge";
import { Loader2, Pin, PinOff } from "lucide-react";
import { usePluginVersions, usePinPluginVersion } from "@/hooks/usePlugins";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pluginId: string;
  pluginName: string;
  installationId: string;
  pinnedVersion: string | null;
  currentVersion: string;
}

export function PluginVersionDialog({
  open, onOpenChange, pluginId, pluginName, installationId, pinnedVersion, currentVersion,
}: Props) {
  const { data: versions, isLoading } = usePluginVersions(open ? pluginId : null);
  const pin = usePinPluginVersion();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Versões — {pluginName}</DialogTitle>
          <DialogDescription>
            Fixe uma versão específica do plugin ou siga sempre a versão atual ({currentVersion}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded border">
            <div>
              <p className="text-sm font-medium">Acompanhar versão atual</p>
              <p className="text-xs text-muted-foreground">
                Receberá automaticamente atualizações publicadas pelo fornecedor.
              </p>
            </div>
            <Button
              size="sm"
              variant={pinnedVersion === null ? "default" : "outline"}
              disabled={pinnedVersion === null || pin.isPending}
              onClick={() => pin.mutate({ id: installationId, version: null })}
            >
              <PinOff className="h-4 w-4 mr-1" />
              {pinnedVersion === null ? "Selecionado" : "Usar atual"}
            </Button>
          </div>

          <div className="border rounded divide-y max-h-80 overflow-auto">
            {isLoading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !versions || versions.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma versão publicada ainda.
              </div>
            ) : (
              versions.map((v) => {
                const isPinned = pinnedVersion === v.version;
                return (
                  <div key={v.id} className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">v{v.version}</span>
                        {isPinned && <Badge variant="default" className="text-xs">Fixada</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.published_at).toLocaleString("pt-BR")}
                      </p>
                      {v.changelog && (
                        <p className="text-xs mt-1 line-clamp-3">{v.changelog}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isPinned ? "secondary" : "outline"}
                      disabled={isPinned || pin.isPending}
                      onClick={() => pin.mutate({ id: installationId, version: v.version })}
                    >
                      <Pin className="h-3.5 w-3.5 mr-1" />
                      Fixar
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
