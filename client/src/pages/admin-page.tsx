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
import { MapPin, Plus, Edit, Trash2, Tags, Search, X, Filter, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/lib/protected-route";

function AdminPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<number | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "visited" | "to_visit">("all");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
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

  const filteredPlaces = places.filter(place => {
    // Text search filter
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.cityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.stateName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = selectedTypeFilter === null || place.typeId === selectedTypeFilter;
    
    // Status filter
    const matchesStatus = selectedStatusFilter === "all" || 
      (selectedStatusFilter === "visited" && place.isVisited) ||
      (selectedStatusFilter === "to_visit" && !place.isVisited);
    
    // Rating filter
    const matchesRating = selectedRatingFilter === null || 
      (place.rating && Math.floor(parseFloat(place.rating)) >= selectedRatingFilter);
    
    return matchesSearch && matchesType && matchesStatus && matchesRating;
  });

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
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Gerenciar Lugares</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar lugares..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                        data-testid="input-search-places"
                      />
                    </div>
                  </div>
                  
                  {/* Filters Row */}
                  <div className="flex flex-col items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>
                    
                    {/* Type Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm text-gray-600 whitespace-nowrap">Tipo:</span>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant={selectedTypeFilter === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTypeFilter(null)}
                          className={`h-7 text-xs ${
                            selectedTypeFilter === null
                              ? "bg-togo-primary text-white hover:bg-togo-primary"
                              : "hover:bg-gray-100"
                          }`}
                          data-testid="filter-type-all"
                        >
                          Todos
                        </Button>
                        {placeTypes.map((type) => (
                          <Button
                            key={type.id}
                            variant={selectedTypeFilter === type.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTypeFilter(type.id)}
                            className={`h-7 text-xs ${
                              selectedTypeFilter === type.id
                                ? "bg-togo-primary text-white hover:bg-togo-primary"
                                : "hover:bg-gray-100"
                            }`}
                            data-testid={`filter-type-${type.id}`}
                          >
                            {type.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm text-gray-600 whitespace-nowrap">Status:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: "all", label: "Todos" },
                          { value: "visited", label: "Visitados" },
                          { value: "to_visit", label: "Para Visitar" }
                        ].map((status) => (
                          <Button
                            key={status.value}
                            variant={selectedStatusFilter === status.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedStatusFilter(status.value as any)}
                            className={`h-7 text-xs ${
                              selectedStatusFilter === status.value
                                ? "bg-togo-secondary text-white hover:bg-togo-secondary"
                                : "hover:bg-gray-100"
                            }`}
                            data-testid={`filter-status-${status.value}`}
                          >
                            {status.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Rating Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <span className="text-sm text-gray-600 whitespace-nowrap">Avaliação:</span>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant={selectedRatingFilter === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedRatingFilter(null)}
                          className={`h-7 text-xs flex-shrink-0 ${
                            selectedRatingFilter === null
                              ? "bg-togo-light text-white hover:bg-togo-light"
                              : "hover:bg-gray-100"
                          }`}
                          data-testid="filter-rating-all"
                        >
                          Todas
                        </Button>
                        {[5, 4, 3, 2].map((rating) => (
                          <Button
                            key={rating}
                            variant={selectedRatingFilter === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedRatingFilter(rating)}
                            className={`h-7 text-xs flex items-center gap-1 flex-shrink-0 min-w-[50px] ${
                              selectedRatingFilter === rating
                                ? "bg-togo-light text-white hover:bg-togo-light"
                                : "hover:bg-gray-100"
                            }`}
                            data-testid={`filter-rating-${rating}`}
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {rating}+
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Clear Filters */}
                    {(selectedTypeFilter !== null || selectedStatusFilter !== "all" || selectedRatingFilter !== null) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTypeFilter(null);
                          setSelectedStatusFilter("all");
                          setSelectedRatingFilter(null);
                        }}
                        className="h-7 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        data-testid="filter-clear-all"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                  
                  {/* Results Count */}
                  <div className="text-sm text-gray-500">
                    {filteredPlaces.length === places.length ? (
                      `${places.length} ${places.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}`
                    ) : (
                      `${filteredPlaces.length} de ${places.length} lugares encontrados`
                    )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredPlaces.map((place) => (
                      <Card 
                        key={place.id}
                        className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-togo-primary/20 hover:border-togo-primary/50 hover:-translate-y-1 overflow-hidden bg-white hover:bg-gradient-to-br hover:from-white hover:to-togo-lightest/30"
                        onClick={() => {
                          setSelectedPlace(place);
                          setIsDetailsModalOpen(true);
                        }}
                        data-testid={`card-place-${place.id}`}
                      >
                        {/* Image Section */}
                        <div className="relative h-48 bg-gradient-to-br from-togo-lightest to-togo-lighter">
                          {place.mainImage ? (
                            <img 
                              src={place.mainImage} 
                              alt={place.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              data-testid={`img-place-${place.id}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <MapPin className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Type Badge - Positioned on image */}
                          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                            <Badge 
                              className={`shadow-sm ${
                                place.type.name === "Restaurante" ? "bg-togo-primary text-white hover:bg-togo-primary" : 
                                place.type.name === "Ponto Turístico" ? "bg-togo-secondary text-white hover:bg-togo-secondary" : 
                                place.type.name === "Cidade" ? "bg-togo-light text-white hover:bg-togo-light" : 
                                "bg-gray-600 text-white"
                              }`}
                              data-testid={`badge-type-${place.id}`}
                            >
                              {place.type.name}
                            </Badge>
                            {place.hasRodizio && (
                              <Badge variant="destructive" className="shadow-sm text-xs">
                                Rodízio
                              </Badge>
                            )}
                            {place.isClone && (
                              <Badge variant="outline" className="text-xs bg-white/90 text-blue-700 border-blue-200 shadow-sm">
                                Clone
                              </Badge>
                            )}
                          </div>

                          {/* Status Badge - Positioned on image */}
                          <div className="absolute top-3 right-3">
                            <Badge 
                              variant={place.isVisited ? "default" : "secondary"}
                              className={`shadow-sm ${place.isVisited ? "bg-togo-secondary text-white hover:bg-togo-secondary" : "bg-white/90 text-gray-700 hover:bg-white"}`}
                              data-testid={`badge-status-${place.id}`}
                            >
                              {place.isVisited ? "Visitado" : "Para visitar"}
                            </Badge>
                          </div>
                        </div>

                        {/* Content Section */}
                        <CardContent className="p-4 md:p-6 space-y-3">
                          {/* Name and Date */}
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-togo-primary transition-colors duration-200 line-clamp-2" data-testid={`text-name-${place.id}`}>
                              {place.name}
                            </h3>
                            <div className="text-sm text-gray-500 mt-1">
                              Cadastrado em {new Date(place.createdAt).toLocaleDateString('pt-BR')}
                              {place.isClone && place.clonedFromUserId && (
                                <div className="text-blue-600 text-xs mt-1">Clonado do usuário #{place.clonedFromUserId}</div>
                              )}
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-togo-primary" />
                            <span data-testid={`text-location-${place.id}`}>{place.cityName}, {place.stateName}</span>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center" data-testid={`rating-${place.id}`}>
                            {place.rating ? (
                              <StarRating rating={parseFloat(place.rating)} size="sm" />
                            ) : (
                              <span className="text-gray-400 text-sm">Sem avaliação</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-togo-primary hover:text-togo-secondary hover:bg-togo-lightest hover:scale-110 transition-all duration-200 p-2 min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] touch-manipulation"
                                title="Editar lugar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPlace(place);
                                }}
                                data-testid={`button-edit-${place.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-110 transition-all duration-200 p-2 min-h-[44px] min-w-[44px] md:min-h-[36px] md:min-w-[36px] touch-manipulation"
                                title="Excluir lugar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Tem certeza que deseja excluir "${place.name}"?`)) {
                                    deletePlaceMutation.mutate(place.id);
                                  }
                                }}
                                disabled={deletePlaceMutation.isPending}
                                data-testid={`button-delete-${place.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="text-xs text-gray-400">
                              ID: {place.id}
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
