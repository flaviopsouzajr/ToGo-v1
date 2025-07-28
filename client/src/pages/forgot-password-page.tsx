import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetRequestSchema, type PasswordResetRequest } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Mail, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<PasswordResetRequest>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: PasswordResetRequest) => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/password-reset/request", data);
      const result = await res.json();
      
      setSubmitted(true);
      toast({
        title: "Solicitação processada",
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
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
                <Mail className="text-green-600 w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Email Enviado!
              </h1>
              <p className="text-gray-600">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <p className="text-sm text-gray-600">
                    O código de verificação é válido por 15 minutos.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setLocation("/reset-password")}
                      className="w-full bg-togo-primary hover:bg-togo-secondary"
                    >
                      Já tenho o código
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        form.reset();
                      }}
                      className="w-full"
                    >
                      Enviar novamente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Link href="/auth" className="text-sm text-gray-600 hover:text-togo-primary flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar ao login
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
                Recupere seu acesso
              </h2>
              <p className="text-xl text-togo-lightest">
                Verifique seu email e siga as instruções para redefinir sua senha de forma segura.
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
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="text-blue-600 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Esqueci minha senha
            </h1>
            <p className="text-gray-600">
              Digite seu email para receber as instruções de recuperação
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recuperar Senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="Digite seu email cadastrado"
                    required
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-togo-primary hover:bg-togo-secondary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Enviando..." : "Enviar código de recuperação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/auth" className="text-sm text-gray-600 hover:text-togo-primary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao login
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
              Recupere seu acesso
            </h2>
            <p className="text-xl text-togo-lightest">
              Digite seu email e receberá um código para redefinir sua senha de forma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}