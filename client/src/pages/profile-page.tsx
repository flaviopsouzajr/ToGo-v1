import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UploadResult } from "@uppy/core";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ImageCropper } from "@/components/ImageCropper";
import { User, Camera, Mail, Tag, Loader2 } from "lucide-react";
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
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");

  // Fetch current user data
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({})
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
      setPreviewImage(user.profilePictureUrl || "");
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
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== "")
    );
    updateProfileMutation.mutate(cleanData);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Falha ao gerar URL de upload");
      }
      
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL
      };
    } catch (error) {
      toast({
        title: "Erro ao gerar URL de upload",
        description: "Não foi possível gerar a URL para upload.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const imageUrl = uploadedFile.uploadURL;
      
      if (imageUrl) {
        // Show cropper with uploaded image
        setTempImageSrc(imageUrl);
        setShowCropper(true);
      }
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setIsUploadingImage(true);
    setShowCropper(false);
    
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
      
      // Upload cropped image  
      const uploadResult = await fetch(uploadURL, {
        method: "PUT",
        body: croppedImageBlob
      });
      
      if (!uploadResult.ok) {
        throw new Error("Falha no upload da imagem");
      }
      
      // Update preview immediately
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
      setPreviewImage(croppedImageUrl);
      
      // Update profile picture in backend
      const response = await fetch("/api/profile-picture", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ imageUrl: uploadURL })
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar foto de perfil");
      }
      
      toast({
        title: "Foto de perfil atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso."
      });
      
      // Invalidate user query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (error) {
      toast({
        title: "Erro ao atualizar foto",
        description: "Ocorreu um erro ao salvar a foto de perfil.",
        variant: "destructive"
      });
      // Revert preview on error
      setPreviewImage(user?.profilePictureUrl || "");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc("");
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
                    src={previewImage || user?.profilePictureUrl || ""} 
                    alt={user?.name || user?.username || "Perfil"} 
                  />
                  <AvatarFallback className="text-2xl bg-togo-primary text-white">
                    {(user?.name || user?.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-2">
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB for better quality before cropping
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center justify-center">
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingImage ? "Processando..." : "Alterar Foto"}
                  </div>
                </ObjectUploader>

                <p className="text-xs text-gray-500">
                  JPG, PNG ou WebP. Máximo 5MB.
                  <br />
                  Você poderá ajustar o enquadramento após o upload.
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

      {/* Image Cropper Modal */}
      <ImageCropper
        imageSrc={tempImageSrc}
        isOpen={showCropper}
        onClose={handleCropCancel}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}