import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/base/button";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  perPage: number;
  total: number;
  setPage: (updater: (p: number) => number) => void;
  goToPage: (n: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  perPage,
  total,
  setPage,
  goToPage,
}: PaginationControlsProps) {
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav
      className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
      aria-label="Paginação de resultados"
    >
      <p className="text-xs text-muted-foreground">
        Mostrando {(page - 1) * perPage + 1}
        {"–"}
        {Math.min(page * perPage, total)} de {total} · Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        {pages.map((i) => (
          <Button
            key={i}
            variant={i === page ? "default" : "ghost"}
            size="sm"
            className="min-w-9"
            onClick={() => goToPage(i)}
            aria-current={i === page ? "page" : undefined}
            aria-label={`Ir para página ${i}`}
          >
            {i}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          aria-label="Próxima página"
        >
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </nav>
  );
}
