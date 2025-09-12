import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { PlaceCard } from "@/components/place-card";
import { PlaceDetailsModal } from "@/components/place-details-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { PlaceWithType, PlaceType } from "@shared/schema";
import { states } from "@/lib/estados-cidades";
import { ProtectedRoute } from "@/lib/protected-route";

function PlacesPageContent() {
  const [filters, setFilters] = useState({
    typeIds: [] as number[],
    stateId: "all",
    hasRodizio: null as boolean | null,
    isVisited: null as boolean | null,
    minRating: "all",
    search: "",
  });

  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const { data: places = [], isLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/places", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Filtrar apenas lugares do usuário logado (não é mais necessário o parâmetro)
      // A API já filtra automaticamente
      
      if (filters.typeIds.length > 0) {
        filters.typeIds.forEach(id => params.append("typeIds", id.toString()));
      }
      if (filters.stateId && filters.stateId !== "all") params.set("stateId", filters.stateId);
      if (filters.hasRodizio !== null) params.set("hasRodizio", filters.hasRodizio.toString());
      if (filters.isVisited !== null) params.set("isVisited", filters.isVisited.toString());
      if (filters.minRating && filters.minRating !== "all") params.set("minRating", filters.minRating);
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
      stateId: "all",
      hasRodizio: null,
      isVisited: null,
      minRating: "all",
      search: "",
    });
  };

  const handlePlaceClick = (place: PlaceWithType) => {
    setSelectedPlace(place);
    setIsModalOpen(true);
  };

  // Detectar quando o filtro está fixo no topo usando posição real
  useEffect(() => {
    const filterElement = filterRef.current;
    if (!filterElement) return;

    const handleScroll = () => {
      const rect = filterElement.getBoundingClientRect();
      // Obtém o offset atual baseado na tela (responsivo)
      const computedStyle = window.getComputedStyle(filterElement);
      const topValue = parseInt(computedStyle.top) || 0;
      
      // Considera sticky quando o elemento está na posição fixa dele
      setIsFilterSticky(rect.top <= topValue + 5); // +5px margem de tolerância
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Verificar estado inicial
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card 
              ref={filterRef}
              className={`
                sticky top-4 sm:top-6 lg:top-20 z-10
                transition-all duration-300 ease-in-out
                max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-6rem)]
                overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
                ${isFilterSticky 
                  ? 'shadow-lg border-gray-200 bg-white/95 backdrop-blur-sm' 
                  : 'shadow-sm bg-white border-gray-200'
                }
              `}>
              <CardHeader className={`
                ${isFilterSticky ? 'border-b border-gray-100' : ''}
                transition-colors duration-300
              `}>
                <CardTitle 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                >
                  <span className="flex items-center">
                    <Filter className="mr-2 h-5 w-5" />
                    <span className="font-semibold">Filtros</span>
                    {isFiltersExpanded ? (
                      <ChevronUp className="ml-2 h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                    )}
                  </span>
                  {isFiltersExpanded && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilters();
                      }}
                      className="hover:bg-gray-100"
                    >
                      Limpar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              {isFiltersExpanded && (
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
                        <SelectItem value="all">Todos os estados</SelectItem>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Min Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avaliação Mínima
                    </label>
                    <Select value={filters.minRating} onValueChange={(value) => 
                      setFilters(prev => ({ ...prev, minRating: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a avaliação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as avaliações</SelectItem>
                        <SelectItem value="4">4+ estrelas</SelectItem>
                        <SelectItem value="3">3+ estrelas</SelectItem>
                        <SelectItem value="2">2+ estrelas</SelectItem>
                        <SelectItem value="1">1+ estrela</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Restaurant specific filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Opções Específicas
                    </label>
                    <div className="space-y-3">
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
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="not-visited"
                          checked={filters.isVisited === false}
                          onCheckedChange={(checked) => 
                            setFilters(prev => ({ 
                              ...prev, 
                              isVisited: checked ? false : null 
                            }))
                          }
                        />
                        <label htmlFor="not-visited" className="text-sm text-gray-600 cursor-pointer">
                          Não Visitado
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
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
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onClick={() => handlePlaceClick(place)}
                  />
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

      {/* Place Details Modal */}
      <PlaceDetailsModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlace(null);
        }}
      />
    </div>
  );
}

export default function PlacesPage() {
  return (
    <ProtectedRoute>
      <PlacesPageContent />
    </ProtectedRoute>
  );
}