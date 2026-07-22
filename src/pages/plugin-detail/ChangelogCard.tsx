import { Card, CardContent, CardHeader, CardTitle } from "@/ui/base/card";
import { Badge } from "@/ui/base/badge";

interface Version {
  id: string;
  version: string;
  changelog: string | null;
  published_at: string;
}

export function ChangelogCard({
  versions, currentVersion, pinnedVersion,
}: {
  versions: Version[] | undefined;
  currentVersion: string;
  pinnedVersion?: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Changelog</CardTitle>
      </CardHeader>
      <CardContent>
        {!versions || versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma versão publicada ainda.</p>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="border-l-2 pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">v{v.version}</span>
                  {v.version === currentVersion && (
                    <Badge variant="default" className="text-xs">Atual</Badge>
                  )}
                  {pinnedVersion === v.version && (
                    <Badge variant="secondary" className="text-xs">Fixada</Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(v.published_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {v.changelog ? (
                  <p className="text-sm mt-1 whitespace-pre-wrap text-muted-foreground">
                    {v.changelog}
                  </p>
                ) : (
                  <p className="text-xs italic text-muted-foreground mt-1">Sem notas de versão.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
