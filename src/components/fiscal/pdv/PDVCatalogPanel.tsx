import { forwardRef, type RefObject } from 'react';
import { Camera, CameraOff, Keyboard, LayoutGrid, Package, QrCode, ScanLine, Search, Plus, List, Grid, Info } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { hashColor } from '@/hooks/inventory/useCategories';
import type { DbProduct } from '@/hooks/inventory/useProducts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';

export type InputMode = 'search' | 'scanner' | 'camera';

interface CatalogCategory {
  id: string;
  name: string;
  color?: string | null;
}

interface PDVCatalogPanelProps {
  inputMode: InputMode;
  onChangeInputMode: (m: InputMode) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  searchRef: RefObject<HTMLInputElement>;
  videoRef: RefObject<HTMLVideoElement>;
  productsCount: number;
  isLoading: boolean;
  categories: CatalogCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  filteredProducts: DbProduct[];
  term: string;
  onPickProduct: (p: DbProduct) => void;
  viewMode?: 'grid' | 'list';
  onChangeViewMode?: (m: 'grid' | 'list') => void;
}

const placeholderByMode: Record<InputMode, string> = {
  search: 'Buscar por nome, código ou EAN...',
  scanner: 'Aponte o leitor e pressione ENTER',
  camera: 'Aponte a câmera para o QR Code ou código de barras',
};

export const PDVCatalogPanel = forwardRef<HTMLDivElement, PDVCatalogPanelProps>(function PDVCatalogPanel({
  inputMode, onChangeInputMode, search, onSearchChange, onSearchKeyDown, searchRef, videoRef,
  productsCount, isLoading, categories, selectedCategoryId, onSelectCategory,
  filteredProducts, term, onPickProduct, viewMode = 'grid', onChangeViewMode,
}, ref) {
  return (
    <div ref={ref} className="flex flex-col h-full overflow-hidden">
      {/* Input mode tabs */}
      <div className="px-6 pt-6 flex items-center justify-between">
        <div className="inline-flex bg-muted/60 p-1 rounded-xl gap-1 border border-primary/5">
          {([
            { key: 'search', label: 'Busca Manual', Icon: Keyboard },
            { key: 'scanner', label: 'Leitor Laser', Icon: ScanLine },
            { key: 'camera', label: 'Câmera Vision', Icon: QrCode },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { onSearchChange(''); onChangeInputMode(key); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                inputMode === key
                  ? 'bg-background shadow-lg shadow-primary/10 text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {onChangeViewMode && (
            <div className="flex bg-muted/60 rounded-xl p-1 gap-1 border border-primary/5 shadow-inner">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onChangeViewMode('grid')}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        viewMode === 'grid' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px] font-bold">Modo Galeria</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onChangeViewMode('list')}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        viewMode === 'list' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px] font-bold">Modo Lista (Fila)</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <Badge variant="outline" className="gap-2 h-9 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-[0.15em] text-[10px]">
            <Package className="h-3.5 w-3.5" /> {productsCount} itens ativos
          </Badge>
        </div>
      </div>

      {/* Input / Camera area */}
      <div className="px-6 pt-4">
        {inputMode !== 'camera' ? (
          <div className="relative group">
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
              inputMode === 'search' ? "text-muted-foreground group-focus-within:text-primary group-focus-within:scale-110" : "text-primary animate-pulse"
            )}>
              {inputMode === 'search' ? <Search className="h-6 w-6" /> : <ScanLine className="h-6 w-6" />}
            </div>
            <Input
              ref={searchRef}
              placeholder={placeholderByMode[inputMode]}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="pl-14 h-16 text-lg font-bold border-2 focus-visible:ring-primary/20 bg-background shadow-2xl shadow-primary/5 rounded-2xl transition-all hover:border-primary/30"
              inputMode={inputMode === 'scanner' ? 'numeric' : 'text'}
              autoComplete="off"
            />
            {inputMode === 'scanner' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-primary font-black uppercase tracking-[0.2em] bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-bounce">Aguardando Bip</div>
            )}
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden border-4 border-primary/20 bg-black aspect-[21/9] shadow-2xl group">
            <video ref={videoRef} className="w-full h-full object-cover opacity-80" muted playsInline />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-1/2 h-32 border-2 border-primary/80 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-[scan_2s_infinite] shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
              </div>
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-white/10">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Vision Engine Ativo
            </div>
            <Button variant="secondary" size="sm" className="absolute top-4 right-4 h-10 px-4 rounded-full font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md" onClick={() => onChangeInputMode('search')}>
              <CameraOff className="h-4 w-4 mr-2" /> Encerrar Vision
            </Button>
          </div>
        )}
      </div>

      {/* Category tabs */}
      {inputMode !== 'camera' && categories.length > 0 && (
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 shadow-sm',
                !selectedCategoryId
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'bg-background border-primary/5 hover:border-primary/20 text-muted-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Todas as Linhas
            </button>
            {categories.map((cat) => {
              const c = cat.color || hashColor(cat.name);
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  style={active ? { backgroundColor: c, borderColor: c, color: '#fff' } : { borderColor: `${c}33` }}
                  className={cn(
                    'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 shadow-sm',
                    !active && 'bg-background hover:brightness-95 hover:border-primary/20',
                  )}
                >
                  <span className="inline-block h-2 w-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: active ? '#fff' : c }} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product grid */}
      {inputMode !== 'camera' && (
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
              <div className="w-8 h-px bg-muted-foreground/20" />
              {term ? `Resultados da Pesquisa (${filteredProducts.length})` : 'Sugestões da Loja'}
              <div className="w-8 h-px bg-muted-foreground/20" />
            </h3>
            {isLoading && (
              <div className="flex items-center gap-2 text-[10px] text-primary font-black animate-pulse uppercase">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Sincronizando...
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 rounded-3xl border-2 border-dashed border-primary/10 bg-muted/5 opacity-60">
              <Package className="h-12 w-12 text-primary/40 mb-4" />
              <p className="font-black uppercase tracking-widest text-sm mb-1">Nada encontrado</p>
              <p className="text-xs text-muted-foreground text-center">Tente termos mais genéricos ou verifique o código EAN</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pb-8">
              {filteredProducts.slice(0, 36).map((p) => (
                <button
                  key={p.id}
                  className="flex flex-col text-left p-3 rounded-2xl bg-background border border-primary/5 hover:border-primary hover:shadow-[0_10px_30px_-5px_rgba(var(--primary),0.15)] hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden shadow-sm"
                  onClick={() => onPickProduct(p)}
                >
                  <div className="absolute top-0 right-0 p-1 z-10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 translate-y--2 group-hover:translate-x-0 group-hover:translate-y-0">
                    <div className="bg-primary text-primary-foreground rounded-bl-xl rounded-tr-lg p-1.5 shadow-lg">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="relative aspect-square w-full rounded-xl bg-muted/20 mb-3 overflow-hidden border border-primary/5 shadow-inner">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-40 group-hover:scale-125 transition-transform duration-500">
                        <Package className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="font-black text-xs line-clamp-2 leading-tight mb-1 min-h-[2.2rem] group-hover:text-primary transition-colors tracking-tight uppercase">
                    {p.name}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] text-muted-foreground font-black tracking-widest bg-muted/50 px-2 py-0.5 rounded-md border border-primary/5">
                      {p.code}
                    </span>
                    {p.current_stock !== undefined && (
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-4 px-1.5 font-black uppercase",
                        (p.current_stock ?? 0) > 10 ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/20" : "text-rose-600 bg-rose-500/5 border-rose-500/20"
                      )}>
                        Estoque: {p.current_stock}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-dashed border-primary/10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Preço Unit.</span>
                      <div className="text-base font-black text-primary tabular-nums leading-none tracking-tighter">
                        {formatBRL(p.sale_price)}
                      </div>
                    </div>
                    <Badge className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase px-2 py-0.5 shadow-sm">
                      {p.unit}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 pb-8">
              {filteredProducts.slice(0, 50).map((p) => (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl bg-background border border-primary/5 hover:border-primary hover:bg-primary/5 hover:shadow-lg transition-all duration-300 group"
                  onClick={() => onPickProduct(p)}
                >
                  <div className="w-12 h-12 rounded-xl border border-primary/5 bg-muted/30 shrink-0 overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-black text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-black tracking-widest bg-muted/50 px-1.5 rounded-md">{p.code}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-bold uppercase">• Em estoque: {p.current_stock || 0}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 px-4 border-l border-primary/5">
                    <div className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Valor Venda</div>
                    <div className="text-base font-black text-primary tabular-nums leading-none tracking-tight">{formatBRL(p.sale_price)}</div>
                    <div className="text-[9px] font-black uppercase text-muted-foreground/60 mt-0.5">{p.unit}</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Visual footer hint */}
      <div className="px-6 py-2 border-t bg-muted/5 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          <Info className="h-3 w-3" />
          Use as Setas para Navegar • Enter para Adicionar • Esc para Limpar
        </div>
      </div>
    </div>
  );
});

