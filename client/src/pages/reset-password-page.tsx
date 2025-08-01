import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetSchema, type PasswordReset } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PasswordResetTest } from "@/components/password-reset-test";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<PasswordReset>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      code: "",
      newPassword: "",
    },
  });

  const handleCodeReceived = (code: string) => {
    form.setValue("code", code);
  };

  const onSubmit = async (data: PasswordReset) => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("/api/password-reset/verify", {
        method: "POST",
        body: JSON.stringify(data)
      });
      const result = await res.json();
      
      setSuccess(true);
      toast({
        title: "Sucesso",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Código inválido ou expirado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left side - Success message */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-togo-primary rounded-xl flex items-center justify-center">
                  <MapPin className="text-white w-7 h-7" />
                </div>
                <span className="text-3xl font-bold togo-primary">ToGo</span>
              </Link>
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600 w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Senha redefinida!
              </h1>
              <p className="text-gray-600">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={() => setLocation("/auth")}
                  className="w-full bg-togo-primary hover:bg-togo-secondary"
                >
                  Fazer login
                </Button>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-togo-primary">
                ← Voltar ao início
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Hero */}
        <div 
          className="hidden lg:block flex-1 bg-cover bg-center relative"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-togo-primary bg-opacity-80 flex items-center justify-center">
            <div className="text-white text-center max-w-md">
              <h2 className="text-4xl font-bold mb-4">
                Acesso restaurado!
              </h2>
              <p className="text-xl text-togo-lightest">
                Sua senha foi redefinida com sucesso. Faça login e continue explorando lugares incríveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-togo-primary rounded-xl flex items-center justify-center">
                <MapPin className="text-white w-7 h-7" />
              </div>
              <span className="text-3xl font-bold togo-primary">ToGo</span>
            </Link>
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-orange-600 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Redefinir senha
            </h1>
            <p className="text-gray-600">
              Digite o código recebido por email e sua nova senha
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nova Senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="code">Código de verificação</Label>
                  <Input
                    id="code"
                    {...form.register("code")}
                    placeholder="Digite o código de 6 dígitos"
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-wider"
                    required
                  />
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.code.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Verifique o código de 6 dígitos enviado para seu email
                  </p>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...form.register("newPassword")}
                    placeholder="Digite sua nova senha"
                    required
                  />
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-togo-primary hover:bg-togo-secondary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center space-y-2">
            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-togo-primary block">
              Não recebeu o código? Solicitar novamente
            </Link>
            <Link href="/auth" className="text-sm text-gray-600 hover:text-togo-primary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao login
            </Link>
          </div>

          {/* Development testing component */}
          <PasswordResetTest onCodeReceived={handleCodeReceived} />
        </div>
      </div>

      {/* Right side - Hero */}
      <div 
        className="hidden lg:block flex-1 bg-cover bg-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-togo-primary bg-opacity-80 flex items-center justify-center">
          <div className="text-white text-center max-w-md">
            <h2 className="text-4xl font-bold mb-4">
              Crie uma nova senha
            </h2>
            <p className="text-xl text-togo-lightest">
              Digite o código enviado por email e defina uma nova senha segura para sua conta.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-togo-primary rounded-lg flex items-center justify-center">
                  <MapPin className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold">ToGo</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Sua plataforma completa para descobrir e catalogar os melhores lugares para visitar em todo o Brasil.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Links Úteis</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Início
                  </Link>
                </li>
                <li>
                  <Link href="/places" className="hover:text-white transition-colors">
                    Lugares
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    Sobre
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>contato@togo.com.br</li>
                <li>(11) 9999-9999</li>
                <li>São Paulo, SP</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2025 ToGo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}