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
import { ProfileImageUploader } from "@/components/ProfileImageUploader";
import { User, Mail, Tag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const profileUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal(""))
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");

  // Fetch current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "redirect" })
  });

  const form = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || ""
    }
  });

  // Set form values when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || ""
      });
      console.log("Setting preview image from user data:", user.profilePictureUrl);
      // Force image refresh by adding timestamp
      if (user.profilePictureUrl) {
        setPreviewImage(`${user.profilePictureUrl}?v=${Date.now()}`);
      } else {
        setPreviewImage("");
      }
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || "Falha ao atualizar perfil");
      }
      
      return response.json();
    },
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

  const updateProfilePictureMutation = useMutation({
    mutationFn: (imageUrl: string) => 
      apiRequest("/api/profile-picture", {
        method: "PUT",
        body: JSON.stringify({ imageUrl })
      }),
    onSuccess: () => {
      toast({
        title: "Foto de perfil atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso."
      });
      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar foto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ProfileUpdateData) => {
    // Remove empty strings to avoid updating with empty values
    const cleanData: Partial<ProfileUpdateData> = {};
    if (data.name && data.name.trim() !== "") {
      cleanData.name = data.name.trim();
    }
    if (data.email && data.email.trim() !== "") {
      cleanData.email = data.email.trim();
    }
    
    updateProfileMutation.mutate(cleanData);
  };



  const handleImageUpdate = async (croppedImageBlob: Blob) => {
    console.log("handleImageUpdate called with blob size:", croppedImageBlob.size);
    setIsUploadingImage(true);
    
    try {
      // Get upload URL for cropped image
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Falha ao gerar URL de upload");
      }
      
      const { uploadURL } = await uploadResponse.json();
      console.log("Got upload URL for cropped image:", uploadURL);
      
      // Upload cropped image  
      const uploadResult = await fetch(uploadURL, {
        method: "PUT",
        body: croppedImageBlob
      });
      
      if (!uploadResult.ok) {
        throw new Error("Falha no upload da imagem");
      }
      
      console.log("Cropped image uploaded successfully");
      
      // Update profile with new image URL
      const objectPath = uploadURL.split('?')[0];
      console.log("Setting profile picture to:", objectPath);
      
      const updateResponse = await fetch("/api/profile-picture", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageUrl: objectPath })
      });
      
      if (!updateResponse.ok) {
        throw new Error("Falha ao atualizar foto do perfil");
      }
      
      console.log("Profile picture updated successfully");
      
      // Update preview with timestamp to force reload and invalidate cache
      const newImageUrl = `${objectPath}?v=${Date.now()}`;
      setPreviewImage(newImageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso."
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível atualizar a foto de perfil.",
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
                    src={previewImage || ""} 
                    alt={user?.name || user?.username || "Perfil"}
                    key={previewImage} // Force re-render when URL changes
                    onError={() => console.log("Image failed to load:", previewImage)}
                    onLoad={() => console.log("Image loaded successfully:", previewImage)}
                  />
                  <AvatarFallback className="text-2xl bg-togo-primary text-white">
                    {(user?.name || user?.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <ProfileImageUploader
                currentImageUrl={previewImage || user?.profilePictureUrl || undefined}
                onImageUpdate={handleImageUpdate}
                isUploading={isUploadingImage}
              />
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