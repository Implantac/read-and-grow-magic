export const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">READ & GROW — Enterprise Evolution</h1>
      <p className="text-muted-foreground mb-6">A plataforma está em fase de Hardening Crítico (FASE 26 concluída).</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <div className="p-4 border rounded-lg bg-card text-left">
          <h2 className="font-semibold mb-2">Documentação Técnica</h2>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Central de Docs (README.md)</li>
            <li>• Estratégia de Testes e Qualidade</li>
            <li>• Plano de Operações e Recovery</li>
            <li>• Arquitetura e Segurança Consolidada</li>
          </ul>
        </div>
        <div className="p-4 border rounded-lg bg-card text-left">
          <h2 className="font-semibold mb-2">Arquitetura</h2>
          <p className="text-sm text-muted-foreground">Conhecimento: Base de documentação completa para sustentação e escala do ERP.</p>
        </div>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">Consulte docs/hardening/MASTER_PLAN.md para o roadmap completo.</p>
    </div>
  );
};

export default Index;
