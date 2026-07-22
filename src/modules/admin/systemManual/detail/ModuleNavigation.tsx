import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/ui/base/card';

export function ModuleNavigation({ prevModule, nextModule }: { prevModule: any; nextModule: any }) {
  return (
    <Card className="mt-6">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        {prevModule ? (
          <Link to={`/admin/manual/${prevModule.slug}`} className="group flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30 group-hover:border-primary/40 group-hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Anterior</p>
              <p className="text-sm font-medium truncate group-hover:text-primary">{prevModule.title}</p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <Link to="/admin/manual" className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 shrink-0">
          Índice
        </Link>

        {nextModule ? (
          <Link to={`/admin/manual/${nextModule.slug}`} className="group flex items-center gap-3 min-w-0 flex-1 justify-end text-right">
            <div className="min-w-0 hidden sm:block">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Próximo</p>
              <p className="text-sm font-medium truncate group-hover:text-primary">{nextModule.title}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30 group-hover:border-primary/40 group-hover:text-primary transition-colors">
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </CardContent>
    </Card>
  );
}
