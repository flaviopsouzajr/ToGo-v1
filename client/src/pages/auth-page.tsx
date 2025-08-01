import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, loginSchema, type InsertUser, type LoginData } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Shield, UserPlus, LogIn } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in - use useEffect to avoid render issues
  useEffect(() => {
    if (user) {
      // Redirecionar admin para página do carrossel, usuários normais para home
      setLocation(user.isAdmin ? "/carousel-admin" : "/");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-togo-primary rounded-xl flex items-center justify-center">
                <MapPin className="text-white w-7 h-7" />
              </div>
            </Link>
            <div className="w-16 h-16 bg-togo-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Acesso Administrativo
            </h1>
            <p className="text-gray-600">
              Entre ou crie sua conta para gerenciar lugares
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Fazer Login</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-identifier">Nome de usuário ou email</Label>
                      <Input
                        id="login-identifier"
                        {...loginForm.register("identifier")}
                        placeholder="Digite seu nome de usuário ou email"
                        required
                      />
                      {loginForm.formState.errors.identifier && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.identifier.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Digite sua senha"
                        required
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-togo-primary hover:bg-togo-secondary"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                    
                    <div className="text-center">
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-togo-primary hover:text-togo-secondary"
                      >
                        Esqueci minha senha
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Conta</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div>
                      <Label htmlFor="register-username">Nome de usuário</Label>
                      <Input
                        id="register-username"
                        {...registerForm.register("username")}
                        placeholder="Escolha um nome de usuário"
                        required
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        {...registerForm.register("email")}
                        placeholder="Digite seu email"
                        required
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Crie uma senha segura"
                        required
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-togo-primary hover:bg-togo-secondary"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
            backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-togo-primary bg-opacity-80 flex items-center justify-center">
            <div className="text-white text-center max-w-md">
              <h2 className="text-4xl font-bold mb-4">
                Gerencie seus lugares favoritos
              </h2>
              <p className="text-xl text-togo-lightest">
                Cadastre, organize e compartilhe os melhores lugares para visitar com o ToGo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
