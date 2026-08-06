export const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">READ & GROW — Enterprise Evolution</h1>
      <p className="text-muted-foreground mb-6">A plataforma está em fase de Hardening Crítico.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="p-4 border rounded-lg bg-card">
          <h2 className="font-semibold mb-2">Segurança (RLS)</h2>
          <p className="text-sm text-muted-foreground">Isolamento multi-tenant validado em 10 tabelas core.</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h2 className="font-semibold mb-2">Arquitetura</h2>
          <p className="text-sm text-muted-foreground">Documentação técnica consolidada em /docs.</p>
        </div>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Consulte docs/hardening/MASTER_PLAN.md para o roadmap completo.</p>
    </div>
  );
};

export default Index;
