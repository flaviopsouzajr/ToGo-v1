import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PasswordResetTestProps {
  onCodeReceived: (code: string) => void;
}

export function PasswordResetTest({ onCodeReceived }: PasswordResetTestProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const { toast } = useToast();

  const handleRequest = async () => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.resetCode) {
          setResetCode(data.resetCode);
          toast({
            title: "Código gerado",
            description: "Código de teste disponível (modo desenvolvimento)"
          });
        } else {
          toast({
            title: "Email enviado",
            description: data.message
          });
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(resetCode);
    onCodeReceived(resetCode);
    toast({
      title: "Código copiado",
      description: "Código foi copiado e preenchido automaticamente"
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-blue-500" />
          <span>Teste de Recuperação</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No modo desenvolvimento, o código aparece aqui para facilitar os testes.
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="test-email">Email para teste</Label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite qualquer email"
          />
        </div>

        <Button 
          onClick={handleRequest}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Gerando..." : "Gerar código de teste"}
        </Button>

        {resetCode && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Código gerado:</p>
                <p className="text-2xl font-mono font-bold text-green-900">{resetCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="text-green-700 border-green-300"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}