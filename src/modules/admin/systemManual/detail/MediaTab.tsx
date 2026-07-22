import { Camera, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/base/card';

export function MediaTab({ manual }: { manual: any }) {
  return (
    <div className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-4 w-4 text-primary" /> Vídeo de operação
          </CardTitle>
          <CardDescription>
            Grave um vídeo curto (2–5 min) navegando as telas reais e vincule aqui. Use ferramentas como Loom, Zight ou OBS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {manual.videoUrl ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={manual.videoUrl}
                title={`Vídeo — ${manual.title}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Video className="h-10 w-10 opacity-40" />
              <p className="text-sm">Vídeo ainda não vinculado</p>
              <p className="text-xs">Edite este módulo em <code>content.ts</code> e defina <code>videoUrl</code>.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {manual.screenshots && manual.screenshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="h-4 w-4 text-primary" /> Capturas de tela sugeridas
            </CardTitle>
            <CardDescription>
              Recomendações de prints para ilustrar o treinamento. Substitua os placeholders por imagens reais da sua operação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {manual.screenshots.map((s: any, i: number) => (
                <div key={i} className="rounded-lg border border-dashed border-border p-4 bg-muted/20">
                  <div className="aspect-video bg-muted/50 rounded flex items-center justify-center mb-3">
                    <Camera className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <h5 className="font-medium text-sm">{s.title}</h5>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
