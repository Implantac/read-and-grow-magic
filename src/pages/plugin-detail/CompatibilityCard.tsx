import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";
import { MODULE_LABELS } from "@/lib/moduleLabels";

export function CompatibilityCard({ plugin }: { plugin: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compatibilidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-1">Módulos necessários</p>
          {plugin.required_modules.length === 0 ? (
            <p className="text-muted-foreground">Nenhum requisito</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {plugin.required_modules.map((m: string) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {MODULE_LABELS[m] ?? m}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-1">Versão mínima do ERP</p>
          <p>{plugin.min_app_version ?? "Sem restrição"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground mb-1">Identificador (key)</p>
          <code className="text-xs">{plugin.key}</code>
        </div>
      </CardContent>
    </Card>
  );
}
