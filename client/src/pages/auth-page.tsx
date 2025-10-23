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
import { MapPin, Shield, UserPlus, LogIn, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const debouncedUsername = useDebounce(username, 500);

  // Redirect if already logged in - use useEffect to avoid render issues
  useEffect(() => {
    if (user) {
      // Redirecionar todos os usuários para a página inicial
      setLocation("/");
    }
  }, [user, setLocation]);

  // Clear password field on login error
  useEffect(() => {
    if (loginMutation.isError) {
      loginForm.setValue("password", "");
    }
  }, [loginMutation.isError]);

  // Check username availability with debounce
  const { data: usernameCheckData, isLoading: isCheckingUsername } = useQuery({
    queryKey: [`/api/check-username/${debouncedUsername}`],
    enabled: debouncedUsername.length >= 3,
  });

  // Update username availability status
  useEffect(() => {
    if (usernameCheckData) {
      const data = usernameCheckData as { available: boolean; suggestions?: string[] };
      setIsUsernameAvailable(data.available);
      if (!data.available && data.suggestions) {
        setUsernameSuggestions(data.suggestions);
      } else {
        setUsernameSuggestions([]);
      }
    }
  }, [usernameCheckData]);

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
      name: "",
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: InsertUser) => {
    // Validate username availability before submitting
    if (!isUsernameAvailable) {
      registerForm.setError("username", {
        type: "manual",
        message: "Este nome de usuário não está disponível"
      });
      return;
    }
    registerMutation.mutate(data);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    registerForm.setValue("username", value);
    setIsUsernameAvailable(null);
    setUsernameSuggestions([]);
  };

  const selectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    registerForm.setValue("username", suggestion);
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
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          {...loginForm.register("password")}
                          placeholder="Digite sua senha"
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
                      <Label htmlFor="register-name">Nome</Label>
                      <Input
                        id="register-name"
                        {...registerForm.register("name")}
                        placeholder="Digite seu nome"
                        required
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-username">Nome de usuário</Label>
                      <div className="relative">
                        <Input
                          id="register-username"
                          data-testid="input-username"
                          value={username}
                          onChange={handleUsernameChange}
                          placeholder="Escolha um nome de usuário"
                          required
                          className="pr-10"
                        />
                        <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                          {isCheckingUsername && username.length >= 3 && (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          )}
                          {!isCheckingUsername && isUsernameAvailable === true && username.length >= 3 && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" data-testid="icon-username-available" />
                          )}
                          {!isCheckingUsername && isUsernameAvailable === false && username.length >= 3 && (
                            <XCircle className="h-4 w-4 text-red-600" data-testid="icon-username-unavailable" />
                          )}
                        </div>
                      </div>
                      
                      {username.length >= 3 && !isCheckingUsername && isUsernameAvailable === true && (
                        <p className="text-sm text-green-600 mt-1 flex items-center" data-testid="text-username-available">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Nome de usuário disponível
                        </p>
                      )}
                      
                      {username.length >= 3 && !isCheckingUsername && isUsernameAvailable === false && (
                        <div className="mt-1">
                          <p className="text-sm text-red-600 flex items-center" data-testid="text-username-unavailable">
                            <XCircle className="h-3 w-3 mr-1" />
                            Nome de usuário não disponível
                          </p>
                          {usernameSuggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Sugestões disponíveis:</p>
                              <div className="flex flex-wrap gap-2" data-testid="suggestions-container">
                                {usernameSuggestions.map((suggestion) => (
                                  <Button
                                    key={suggestion}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => selectSuggestion(suggestion)}
                                    className="text-xs h-7 px-2 hover:bg-togo-primary hover:text-white"
                                    data-testid={`suggestion-${suggestion}`}
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {username.length > 0 && username.length < 3 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Mínimo 3 caracteres
                        </p>
                      )}
                      
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
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          {...registerForm.register("password")}
                          placeholder="Crie uma senha segura"
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
