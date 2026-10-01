import logoUseSistemas from '@/assets/logo.png';

export function SidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border/40 px-3">
      {collapsed ? (
        <div className="flex w-full justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent ring-1 ring-sidebar-border">
            <img src={logoUseSistemas} alt="Use Sistemas" className="h-6 w-6 object-contain" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-1 animate-fade-in">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent ring-1 ring-sidebar-border">
            <img src={logoUseSistemas} alt="Use Sistemas" className="h-7 w-7 object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-bold text-sidebar-foreground leading-tight tracking-tight truncate">Use Sistemas</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" aria-hidden="true" />
              <p className="text-[9px] font-bold text-primary/85 uppercase tracking-[0.14em]">ERP & WMS</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
