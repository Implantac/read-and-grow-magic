import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/ui/base/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <p className="text-2xl font-semibold text-foreground">Página não encontrada</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            A página que você está procurando não existe ou foi movida para outro endereço.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} aria-label="Voltar à página anterior">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar
          </Button>
          <Button asChild>
            <Link to="/dashboard" aria-label="Ir para o Dashboard">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Ir para o Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
