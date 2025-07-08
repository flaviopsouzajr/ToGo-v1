import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogIn } from "lucide-react";
import { Link } from "wouter";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-togo-primary mx-auto mb-4"></div>
            <p>Verificando permissões...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">
              Você precisa estar logado para acessar esta área.
            </p>
            <Button asChild className="w-full bg-togo-primary hover:bg-togo-secondary">
              <Link href="/auth">
                <LogIn className="w-4 h-4 mr-2" />
                Fazer Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta área administrativa.
            </p>
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation("/")}
            >
              <Link href="/">
                Voltar à Página Inicial
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}