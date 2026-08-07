export const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">READ & GROW — Enterprise Evolution</h1>
      <p className="text-muted-foreground mb-6">A plataforma está em fase de Hardening Crítico (FASE 21 concluída).</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="p-4 border rounded-lg bg-card text-left">
          <h2 className="font-semibold mb-2">Design System / UX</h2>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• ERPDataTable (Paginação e Sorting unificados)</li>
            <li>• StatusBadge (Consolidação de 11 tipos de status)</li>
            <li>• EmptyState (Padronização de estados vazios)</li>
            <li>• UI Base Components (Shadcn hardened)</li>
          </ul>
        </div>
        <div className="p-4 border rounded-lg bg-card text-left">
          <h2 className="font-semibold mb-2">Arquitetura</h2>
          <p className="text-sm text-muted-foreground">UX Consistente: Componentes reutilizáveis garantem integridade visual.</p>
        </div>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Consulte docs/hardening/MASTER_PLAN.md para o roadmap completo.</p>
    </div>
  );
};

export default Index;
