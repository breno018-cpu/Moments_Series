import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <p className="mb-2 text-2xl font-semibold text-foreground">Página não encontrada</p>
        <p className="mb-8 text-muted-foreground">
          A página que você está procurando não existe ou foi removida.
        </p>
        <Button onClick={() => navigate('/')} className="gap-2" size="lg">
          <Home className="h-4 w-4" />
          Voltar ao Catálogo
        </Button>
      </div>
    </div>
  );
};

export default NotFound;