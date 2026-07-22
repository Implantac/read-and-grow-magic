import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/base/button";
import { Label } from "@/ui/base/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/base/select";

interface Props {
  page: number;
  totalPages: number;
  perPage: number;
  total: number;
  perPageOptions: number[];
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
}

export function PaginationBar({ page, totalPages, perPage, total, perPageOptions, onPageChange, onPerPageChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap mt-3 pt-3 border-t text-xs">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Por página:</Label>
        <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
          <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {perPageOptions.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">
          {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))} aria-label="Página anterior">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs px-2">Página {page} / {totalPages}</span>
        <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} aria-label="Próxima página">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
