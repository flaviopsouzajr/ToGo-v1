import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Camera, Mail, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal("")),
  profilePictureUrl: z.string().url("URL de imagem inválida").optional().or(z.literal(""))
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "logout" })
  });

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      profilePictureUrl: user?.profilePictureUrl || ""
    }
  });

  // Set form values when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
        profilePictureUrl: user.profilePictureUrl || ""
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileUpdateData) => 
      apiRequest("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProfileUpdateData) => {
    // Remove empty strings to avoid updating with empty values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "")
    );
    updateProfileMutation.mutate(cleanData);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Arquivo inválido",
        description: "Apenas arquivos JPG, PNG e WebP são permitidos.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // For now, we'll use a simple file upload to a public service like Cloudinary or similar
      // In a real app, you'd upload to your file storage service
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Por enquanto, cole o URL de uma imagem hospedada online no campo abaixo.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da imagem.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-togo-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-togo-primary rounded-xl flex items-center justify-center">
              <User className="text-white w-7 h-7" />
            </div>
            <span className="text-4xl font-bold text-gray-900">Meu Perfil</span>
          </div>
          <p className="text-lg text-gray-600">
            Gerencie suas informações pessoais
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>
                Sua imagem de perfil atual
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center">
                <Avatar className="w-32 h-32">
                  <AvatarImage 
                    src={form.watch("profilePictureUrl") || user?.profilePictureUrl || ""} 
                    alt={user?.name || user?.username || "Perfil"} 
                  />
                  <AvatarFallback className="text-2xl bg-togo-primary text-white">
                    {(user?.name || user?.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('profile-image-upload')?.click()}
                  disabled={isUploadingImage}
                  className="w-full"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {isUploadingImage ? "Enviando..." : "Alterar Foto"}
                </Button>

                <input
                  id="profile-image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <p className="text-xs text-gray-500">
                  JPG, PNG ou WebP. Máximo 5MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seus dados pessoais. O nome de usuário não pode ser alterado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Username (Read-only) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Nome de Usuário
                    </label>
                    <Input
                      value={user?.username || ""}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">
                      O nome de usuário não pode ser alterado.
                    </p>
                  </div>

                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Nome Completo
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Seu nome completo"
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          E-mail
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="seu@email.com"
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profile Picture URL */}
                  <FormField
                    control={form.control}
                    name="profilePictureUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <Camera className="w-4 h-4 mr-2" />
                          URL da Foto de Perfil
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://exemplo.com/minha-foto.jpg"
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Cole o link de uma imagem hospedada online
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}