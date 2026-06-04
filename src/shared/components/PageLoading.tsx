import { Loader2 } from 'lucide-react';

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Carregando...' }: PageLoadingProps) {
  return (
    <div className="flex h-64 items-center justify-center gap-3 animate-fade-in">
      <div className="relative">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="absolute inset-0 h-6 w-6 animate-ping rounded-full bg-primary/20" />
      </div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
