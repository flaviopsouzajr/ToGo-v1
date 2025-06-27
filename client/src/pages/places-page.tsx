import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { PlaceCard } from "@/components/place-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, MapPin } from "lucide-react";
import { PlaceWithType, PlaceType } from "@shared/schema";
import { states } from "@/lib/estados-cidades";

export default function PlacesPage() {
  const [filters, setFilters] = useState({
    typeIds: [] as number[],
    stateId: "",
    hasRodizio: null as boolean | null,
    isVisited: null as boolean | null,
    minRating: "",
    search: "",
  });

  const { data: places = [], isLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/places", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.typeIds.length > 0) {
        filters.typeIds.forEach(id => params.append("typeIds", id.toString()));
      }
      if (filters.stateId) params.set("stateId", filters.stateId);
      if (filters.hasRodizio !== null) params.set("hasRodizio", filters.hasRodizio.toString());
      if (filters.isVisited !== null) params.set("isVisited", filters.isVisited.toString());
      if (filters.minRating) params.set("minRating", filters.minRating);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/places?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch places");
      return res.json();
    },
  });

  const { data: placeTypes = [] } = useQuery<PlaceType[]>({
    queryKey: ["/api/place-types"],
  });

  const handleTypeChange = (typeId: number, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      typeIds: checked 
        ? [...prev.typeIds, typeId]
        : prev.typeIds.filter(id => id !== typeId)
    }));
  };

  const clearFilters = () => {
    setFilters({
      typeIds: [],
      stateId: "",
      hasRodizio: null,
      isVisited: null,
      minRating: "",
      search: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Filter className="mr-2 h-5 w-5" />
                    Filtros
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome do lugar..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Place Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Lugar
                  </label>
                  <div className="space-y-2">
                    {placeTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={filters.typeIds.includes(type.id)}
                          onCheckedChange={(checked) => 
                            handleTypeChange(type.id, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`type-${type.id}`}
                          className="text-sm text-gray-600 cursor-pointer"
                        >
                          {type.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <Select value={filters.stateId} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, stateId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os estados</SelectItem>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avaliação Mínima
                  </label>
                  <Select value={filters.minRating} onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, minRating: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer avaliação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer avaliação</SelectItem>
                      <SelectItem value="1">1+ estrelas</SelectItem>
                      <SelectItem value="2">2+ estrelas</SelectItem>
                      <SelectItem value="3">3+ estrelas</SelectItem>
                      <SelectItem value="4">4+ estrelas</SelectItem>
                      <SelectItem value="5">5 estrelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Special Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Características
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rodizio"
                        checked={filters.hasRodizio === true}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ 
                            ...prev, 
                            hasRodizio: checked ? true : null 
                          }))
                        }
                      />
                      <label htmlFor="rodizio" className="text-sm text-gray-600 cursor-pointer">
                        Com Rodízio
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="visited"
                        checked={filters.isVisited === true}
                        onCheckedChange={(checked) => 
                          setFilters(prev => ({ 
                            ...prev, 
                            isVisited: checked ? true : null 
                          }))
                        }
                      />
                      <label htmlFor="visited" className="text-sm text-gray-600 cursor-pointer">
                        Já Visitado
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Places Grid */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Todos os Lugares
                <span className="text-lg text-gray-500 ml-2">
                  ({places.length} {places.length === 1 ? 'lugar' : 'lugares'})
                </span>
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : places.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {places.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <MapPin className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  Nenhum lugar encontrado
                </h3>
                <p className="text-gray-600 mt-2">
                  Tente ajustar seus filtros ou adicione novos lugares.
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="mt-4"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
