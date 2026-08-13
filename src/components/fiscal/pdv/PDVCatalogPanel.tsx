import { forwardRef, type RefObject } from 'react';
import { Camera, CameraOff, Keyboard, LayoutGrid, Package, QrCode, ScanLine, Search, Plus, List, Grid } from 'lucide-react';
import { Input } from '@/ui/base/input';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { formatBRL } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { hashColor } from '@/hooks/inventory/useCategories';
import type { DbProduct } from '@/hooks/inventory/useProducts';

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
    <div ref={ref}>
      {/* Input mode tabs */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <div className="inline-flex bg-muted/60 rounded-lg p-1 gap-1">
          {([
            { key: 'search', label: 'Busca manual', Icon: Keyboard },
            { key: 'scanner', label: 'Leitor', Icon: ScanLine },
            { key: 'camera', label: 'Câmera / QR', Icon: QrCode },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { onSearchChange(''); onChangeInputMode(key); }}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                inputMode === key
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onChangeViewMode && (
            <div className="flex bg-muted/60 rounded-lg p-1 gap-1">
              <button
                onClick={() => onChangeViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'
                )}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onChangeViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Badge variant="secondary" className="gap-1 h-7">
            <Package className="h-3 w-3" /> {productsCount} produtos
          </Badge>
        </div>
      </div>

      {/* Input / Camera area */}
      <div className="px-6 pt-3">
        {inputMode !== 'camera' ? (
          <div className="relative group">
            {inputMode === 'search'
              ? <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary" />
              : <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
            }
            <Input
              ref={searchRef}
              placeholder={placeholderByMode[inputMode]}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="pl-12 h-12 text-base font-medium border-2 focus-visible:ring-primary/20 bg-background shadow-sm"
              inputMode={inputMode === 'scanner' ? 'numeric' : 'text'}
              autoComplete="off"
            />
            {inputMode === 'scanner' && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted px-2 py-1 rounded">Enter</div>
            )}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-black aspect-[16/6]">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-2/3 h-24 border-2 border-primary/70 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded">
              <Camera className="h-3 w-3" /> Escaneando...
            </div>
            <Button variant="secondary" size="sm" className="absolute top-3 right-3" onClick={() => onChangeInputMode('search')}>
              <CameraOff className="h-4 w-4 mr-1" /> Parar
            </Button>
          </div>
        )}
      </div>

      {/* Category tabs */}
      {inputMode !== 'camera' && categories.length > 0 && (
        <div className="px-6 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => onSelectCategory(null)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border-2',
                !selectedCategoryId
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-background border-transparent hover:border-primary/30 text-muted-foreground',
              )}
            >
              <LayoutGrid className="h-3 w-3" /> Todas
            </button>
            {categories.map((cat) => {
              const c = cat.color || hashColor(cat.name);
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  style={active ? { backgroundColor: c, borderColor: c, color: '#fff' } : { borderColor: `${c}55` }}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border-2',
                    !active && 'bg-background hover:brightness-95',
                  )}
                >
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: active ? '#fff' : c }} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Product grid */}
      {inputMode !== 'camera' && (
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              {term ? `Resultados (${filteredProducts.length})` : 'Sugestões rápidas'}
            </p>
            {isLoading && <span className="text-[10px] text-muted-foreground">Carregando...</span>}
          </div>
          {filteredProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {filteredProducts.slice(0, 18).map((p) => (
                <button
                  key={p.id}
                  className="flex flex-col text-left p-2.5 rounded-xl bg-background border hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all group relative overflow-hidden"
                  onClick={() => onPickProduct(p)}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-primary text-primary-foreground rounded-bl-lg rounded-tr-lg p-1">
                      <Plus className="h-3 w-3" />
                    </div>
                  </div>
                  {p.image_url ? (
                    <div className="aspect-square w-full rounded-lg bg-muted mb-2 overflow-hidden border">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                  ) : (
                    <div className="aspect-square w-full rounded-lg bg-muted/30 mb-2 flex items-center justify-center border border-dashed">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="font-bold text-xs line-clamp-2 leading-tight mb-1 min-h-[2rem] group-hover:text-primary transition-colors">
                    {p.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono mb-2 truncate bg-muted/30 px-1.5 py-0.5 rounded w-fit">
                    {p.code}
                  </div>
                  <div className="mt-auto pt-2 border-t border-dashed flex items-center justify-between">
                    <div className="text-sm font-black text-primary tabular-nums">
                      {formatBRL(p.sale_price)}
                    </div>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground bg-muted px-1 rounded">
                      {p.unit}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProducts.slice(0, 30).map((p) => (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-3 p-2 rounded-lg bg-background border hover:border-primary hover:bg-primary/5 transition-all group"
                  onClick={() => onPickProduct(p)}
                >
                  <div className="w-10 h-10 rounded border bg-muted shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{p.code}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-primary tabular-nums">{formatBRL(p.sale_price)}</div>
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">{p.unit}</div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
