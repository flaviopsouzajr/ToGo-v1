import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { PlaceFormSimple } from "@/components/place-form-simple";
import { PlaceDetailsModal } from "@/components/place-details-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { StarRating } from "@/components/star-rating";
import { PlaceWithType, PlaceType, insertPlaceTypeSchema } from "@shared/schema";
import { MapPin, Plus, Edit, Trash2, Tags, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/lib/protected-route";

function AdminPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<PlaceType | null>(null);
  const [editingPlace, setEditingPlace] = useState<PlaceWithType | null>(null);
  const [activeTab, setActiveTab] = useState("places");
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Navigate to edit tab when editing a place
  useEffect(() => {
    if (editingPlace) {
      setActiveTab("add-place");
    }
  }, [editingPlace]);

  const { data: places = [], isLoading: placesLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/places"],
  });

  const { data: placeTypes = [] } = useQuery<PlaceType[]>({
    queryKey: ["/api/place-types"],
  });

  const filteredPlaces = places.filter(place =>
    place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    place.stateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Place Type form
  const typeForm = useForm({
    resolver: zodResolver(insertPlaceTypeSchema),
    defaultValues: {
      name: "",
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/place-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/place-types"] });
      toast({
        title: "Tipo criado com sucesso!",
        description: "O novo tipo de lugar foi adicionado.",
      });
      typeForm.reset();
      setIsTypeDialogOpen(false);
      setEditingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar tipo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      const res = await apiRequest("PUT", `/api/place-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/place-types"] });
      toast({
        title: "Tipo atualizado com sucesso!",
        description: "O tipo de lugar foi modificado.",
      });
      typeForm.reset();
      setIsTypeDialogOpen(false);
      setEditingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar tipo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/place-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/place-types"] });
      toast({
        title: "Tipo excluído com sucesso!",
        description: "O tipo de lugar foi removido.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir tipo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlaceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/places/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({
        title: "Lugar excluído com sucesso!",
        description: "O lugar foi removido da lista.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir lugar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditType = (type: PlaceType) => {
    setEditingType(type);
    typeForm.setValue("name", type.name);
    setIsTypeDialogOpen(true);
  };

  const handleCreateNewType = () => {
    setEditingType(null);
    typeForm.reset();
    setIsTypeDialogOpen(true);
  };

  const onSubmitType = (data: { name: string }) => {
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, data });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Gerencie lugares e tipos de lugares</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="places" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Lugares
            </TabsTrigger>
            <TabsTrigger value="add-place" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Novo Lugar
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center">
              <Tags className="mr-2 h-4 w-4" />
              Tipos
            </TabsTrigger>
          </TabsList>

          {/* Places Management */}
          <TabsContent value="places" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Lugares</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar lugares..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {placesLoading ? (
                  <div className="text-center py-8">Carregando lugares...</div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mt-4">
                      Nenhum lugar encontrado
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm ? "Tente ajustar sua busca" : "Cadastre o primeiro lugar"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lugar</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlaces.map((place) => (
                        <TableRow 
                          key={place.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => {
                            setSelectedPlace(place);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {place.mainImage ? (
                                <img 
                                  src={place.mainImage} 
                                  alt={place.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900">{place.name}</div>
                                  {place.isClone && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      Clone
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(place.createdAt).toLocaleDateString()}
                                  {place.isClone && place.clonedFromUserId && (
                                    <span className="ml-2 text-blue-600">• Clonado do usuário #{place.clonedFromUserId}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={`
                                ${place.type.name === "Restaurante" ? "bg-togo-primary text-white" : ""}
                                ${place.type.name === "Ponto Turístico" ? "bg-togo-secondary text-white" : ""}
                                ${place.type.name === "Cidade" ? "bg-togo-light text-white" : ""}
                              `}
                            >
                              {place.type.name}
                            </Badge>
                            {place.hasRodizio && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Rodízio
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{place.cityName}, {place.stateName}</TableCell>
                          <TableCell>
                            {place.rating ? (
                              <StarRating rating={parseFloat(place.rating)} size="sm" />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={place.isVisited ? "default" : "secondary"}
                              className={place.isVisited ? "bg-green-100 text-green-800" : ""}
                            >
                              {place.isVisited ? "Visitado" : "Para visitar"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlace(place);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePlaceMutation.mutate(place.id);
                                }}
                                disabled={deletePlaceMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit Place */}
          <TabsContent value="add-place">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingPlace ? "Editar Lugar" : "Cadastrar Novo Lugar"}
                  </CardTitle>
                  {editingPlace && (
                    <Button
                      variant="outline"
                      onClick={() => setEditingPlace(null)}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <PlaceFormSimple 
                  editingPlace={editingPlace}
                  onSuccess={() => {
                    setEditingPlace(null);
                    toast({
                      title: editingPlace ? "Lugar atualizado!" : "Lugar cadastrado!",
                      description: editingPlace ? "As alterações foram salvas com sucesso." : "O lugar foi adicionado à sua lista.",
                    });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Types Management */}
          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciar Tipos de Lugar</CardTitle>
                  <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleCreateNewType} className="bg-togo-primary hover:bg-togo-secondary">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Tipo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingType ? "Editar Tipo" : "Novo Tipo de Lugar"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={typeForm.handleSubmit(onSubmitType)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Tipo
                          </label>
                          <Input
                            {...typeForm.register("name")}
                            placeholder="Ex: Restaurante, Ponto Turístico..."
                            required
                          />
                          {typeForm.formState.errors.name && (
                            <p className="text-sm text-red-600 mt-1">
                              {typeForm.formState.errors.name.message}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsTypeDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit"
                            disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
                            className="bg-togo-primary hover:bg-togo-secondary"
                          >
                            {editingType ? "Atualizar" : "Criar"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {placeTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <Tags className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mt-4">
                      Nenhum tipo cadastrado
                    </h3>
                    <p className="text-gray-600">Crie o primeiro tipo de lugar</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {placeTypes.map((type) => {
                      const placeCount = places.filter(p => p.typeId === type.id).length;
                      return (
                        <Card key={type.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{type.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {placeCount} {placeCount === 1 ? 'lugar' : 'lugares'} cadastrado{placeCount !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditType(type)}
                                  className="text-gray-400 hover:text-togo-primary"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTypeMutation.mutate(type.id)}
                                  disabled={deleteTypeMutation.isPending || placeCount > 0}
                                  className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                                  title={placeCount > 0 ? "Não é possível excluir tipo com lugares cadastrados" : ""}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Place Details Modal */}
      <PlaceDetailsModal
        place={selectedPlace}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedPlace(null);
        }}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminPageContent />
    </ProtectedRoute>
  );
}
