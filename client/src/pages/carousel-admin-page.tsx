import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigation } from "@/components/navigation";
import { insertCarouselImageSchema, type InsertCarouselImage, type CarouselImage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit, Plus, Image, Save, X } from "lucide-react";

// Função para converter URL do Google Drive para formato de exibição
function convertGoogleDriveUrl(url: string): string {
  // Verifica se é URL do Google Drive
  if (url.includes('drive.google.com')) {
    // Extrai o ID do arquivo da URL
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const fileId = match[1];
      // Retorna URL direta para exibição
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  // Retorna URL original se não for do Google Drive
  return url;
}

export default function CarouselAdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);

  const { data: images = [], isLoading } = useQuery<CarouselImage[]>({
    queryKey: ["/api/carousel-images"],
  });

  const form = useForm<InsertCarouselImage>({
    resolver: zodResolver(insertCarouselImageSchema),
    defaultValues: {
      imageUrl: "",
      title: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  const createImageMutation = useMutation({
    mutationFn: async (data: InsertCarouselImage) => {
      const res = await apiRequest("POST", "/api/carousel-images", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carousel-images"] });
      toast({
        title: "Imagem adicionada!",
        description: "A imagem foi adicionada ao carrossel com sucesso.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async (data: InsertCarouselImage) => {
      if (!editingImage) throw new Error("No image to update");
      const res = await apiRequest("PUT", `/api/carousel-images/${editingImage.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carousel-images"] });
      toast({
        title: "Imagem atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
      setEditingImage(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/carousel-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carousel-images"] });
      toast({
        title: "Imagem removida!",
        description: "A imagem foi removida do carrossel.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCarouselImage) => {
    if (editingImage) {
      updateImageMutation.mutate(data);
    } else {
      createImageMutation.mutate(data);
    }
  };

  const handleEdit = (image: CarouselImage) => {
    setEditingImage(image);
    form.reset({
      imageUrl: image.imageUrl,
      title: image.title || "",
      description: image.description || "",
      displayOrder: image.displayOrder || 0,
      isActive: image.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
    form.reset({
      imageUrl: "",
      title: "",
      description: "",
      displayOrder: 0,
      isActive: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciamento do Carrossel
          </h1>
          <p className="text-gray-600">
            Gerencie as imagens que aparecem no carrossel da página inicial
          </p>
        </div>

        <Tabs defaultValue="form" className="space-y-6">
          <TabsList>
            <TabsTrigger value="form" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>{editingImage ? "Editar Imagem" : "Nova Imagem"}</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <Image className="w-4 h-4" />
              <span>Gerenciar Imagens</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {editingImage ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  <span>{editingImage ? "Editar Imagem" : "Adicionar Nova Imagem"}</span>
                </CardTitle>
                {editingImage && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Editando</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Imagem</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://exemplo.com/imagem.jpg"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Insira a URL da imagem que será exibida no carrossel. Para usar imagens do Google Drive, use URLs de compartilhamento como: https://drive.google.com/file/d/ID_DO_ARQUIVO/view
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título (Opcional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Título da imagem"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="displayOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ordem de Exibição</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              Número menor = aparece primeiro
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descrição da imagem que aparecerá sobre ela"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Imagem Ativa
                            </FormLabel>
                            <FormDescription>
                              Apenas imagens ativas são exibidas no carrossel
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-togo-primary hover:bg-togo-secondary"
                      disabled={createImageMutation.isPending || updateImageMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {createImageMutation.isPending || updateImageMutation.isPending
                        ? (editingImage ? "Atualizando..." : "Adicionando...")
                        : (editingImage ? "Atualizar Imagem" : "Adicionar Imagem")
                      }
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Image className="w-5 h-5" />
                  <span>Imagens do Carrossel</span>
                  <Badge variant="secondary">{images.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Carregando imagens...</div>
                ) : images.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma imagem cadastrada ainda
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="aspect-video relative">
                          <img
                            src={convertGoogleDriveUrl(image.imageUrl)}
                            alt={image.title || "Carousel image"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <Badge variant={image.isActive ? "default" : "secondary"}>
                              {image.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {image.title && (
                              <h3 className="font-semibold text-lg truncate">
                                {image.title}
                              </h3>
                            )}
                            {image.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {image.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-2">
                              <Badge variant="outline">
                                Ordem: {image.displayOrder}
                              </Badge>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(image)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja remover esta imagem do carrossel?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteImageMutation.mutate(image.id)}
                                        className="bg-red-500 hover:bg-red-600"
                                      >
                                        Remover
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}