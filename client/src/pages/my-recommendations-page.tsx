import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { PlaceCard } from "@/components/place-card";
import { PlaceDetailsModal } from "@/components/place-details-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Search, Filter } from "lucide-react";
import { Place, PlaceType } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export default function MyRecommendationsPage() {
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");

  // Fetch user's places marked as recommendations
  const { data: places = [], isLoading } = useQuery<Place[]>({
    queryKey: ["/api/places"],
    queryFn: getQueryFn({}),
  });

  // Fetch place types for filtering
  const { data: placeTypes = [] } = useQuery<PlaceType[]>({
    queryKey: ["/api/place-types"],
    queryFn: getQueryFn({}),
  });

  // Filter only places marked as recommendations for friends
  const recommendedPlaces = places.filter(place => place.recommendToFriends);

  // Apply filters to recommended places
  const filteredPlaces = recommendedPlaces.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.cityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.stateName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "all" || place.typeId.toString() === selectedType;
    const matchesState = selectedState === "all" || place.stateName === selectedState;
    
    return matchesSearch && matchesType && matchesState;
  });

  // Get unique states from recommended places
  const uniqueStates = Array.from(new Set(recommendedPlaces.map(place => place.stateName))).filter(Boolean);

  const openDetailsModal = (place: Place) => {
    setSelectedPlace(place);
    setIsDetailsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedState("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-togo-primary rounded-xl flex items-center justify-center">
              <Heart className="text-white w-7 h-7" />
            </div>
            <span className="text-4xl font-bold text-gray-900">Minhas Indicações</span>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lugares que você marcou como indicação para amigos
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-togo-primary mb-2">
              {recommendedPlaces.length}
            </div>
            <div className="text-gray-600">
              {recommendedPlaces.length === 1 ? "Indicação" : "Indicações"} para amigos
            </div>
          </div>
        </div>

        {recommendedPlaces.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma indicação ainda
            </h3>
            <p className="text-gray-600 mb-6">
              Você ainda não marcou nenhum lugar como indicação para amigos.
            </p>
            <Button asChild>
              <a href="/places">
                Ver Meus Lugares
              </a>
            </Button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, descrição ou localização..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full lg:w-48">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {placeTypes.map((type: PlaceType) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full lg:w-48">
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      {uniqueStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando {filteredPlaces.length} de {recommendedPlaces.length} indicações
              </p>
            </div>

            {/* Places Grid */}
            {filteredPlaces.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar os filtros ou buscar por outros termos.
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-6xl">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onViewDetails={() => openDetailsModal(place)}
                  />
                ))}
              </div>
            )}
          </>
        )}
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