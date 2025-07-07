import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AdminPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Página de admin simplificada para teste</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teste de Funcionamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Se você está vendo esta mensagem, a página de admin está funcionando corretamente.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPageSimple() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  );
}