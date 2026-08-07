export const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">READ & GROW — Enterprise Evolution</h1>
      <p className="text-muted-foreground mb-6">A plataforma está em fase de Hardening Crítico (FASE 22 concluída).</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="p-4 border rounded-lg bg-card text-left">
          <h2 className="font-semibold mb-2">UX Operacional</h2>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Atalho Global (Ctrl+K para busca de menus)</li>
            <li>• Breadcrumbs Dinâmicos (Navegação estrutural)</li>
            <li>• Mobile First (Sidebar com foco e acessibilidade)</li>
            <li>• Command Palette (Produtividade acelerada)</li>
          </ul>
        </div>
        <div className="p-4 border rounded-lg bg-card text-left">
          <h2 className="font-semibold mb-2">Arquitetura</h2>
          <p className="text-sm text-muted-foreground">Foco em produtividade: Fluxos operacionais otimizados e atalhos globais.</p>
        </div>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Consulte docs/hardening/MASTER_PLAN.md para o roadmap completo.</p>
    </div>
  );
};

export default Index;
