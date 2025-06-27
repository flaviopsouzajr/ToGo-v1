import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { PlaceCard } from "@/components/place-card";
import { PlaceDetailsModal } from "@/components/place-details-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, MapPin, Star, Route } from "lucide-react";
import { Link } from "wouter";
import { PlaceWithType } from "@shared/schema";

export default function HomePage() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: places = [], isLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/places"],
  });

  const { data: stats } = useQuery<{
    totalPlaces: number;
    visited: number;
    toVisit: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const featuredPlaces = places
    .sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"))
    .slice(0, 3);

  const handlePlaceClick = (place: PlaceWithType) => {
    setSelectedPlace(place);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div 
        className="relative h-96 md:h-[500px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1483729558449-99ef09a8c325?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Descubra lugares incríveis para visitar
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Com o ToGo, encontre os melhores restaurantes, pontos turísticos e experiências únicas.
            </p>
            <Button asChild size="lg" className="bg-togo-primary hover:bg-togo-secondary">
              <Link href="/places">
                Explorar Lugares
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Places */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Lugares em Destaque
          </h2>
          <p className="text-xl text-gray-600">
            Descobertos e avaliados pela nossa comunidade
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : featuredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPlaces.map((place) => (
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
              Nenhum lugar cadastrado ainda
            </h3>
            <p className="text-gray-600 mt-2">
              Seja o primeiro a cadastrar lugares incríveis!
            </p>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-togo-lightest py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-togo-primary mb-2">
                  {stats.totalPlaces}
                </div>
                <div className="text-gray-600">Lugares cadastrados</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-togo-primary mb-2">
                  {stats.visited}
                </div>
                <div className="text-gray-600">Já visitados</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-togo-primary mb-2">
                  {stats.toVisit}
                </div>
                <div className="text-gray-600">Para visitar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Sobre o ToGo</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sua plataforma completa para descobrir, catalogar e compartilhar os melhores lugares para visitar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-togo-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Descubra</h3>
            <p className="text-gray-600">
              Encontre os melhores restaurantes, pontos turísticos e experiências únicas.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-togo-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Avalie</h3>
            <p className="text-gray-600">
              Compartilhe suas experiências e ajude outros viajantes.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-togo-light rounded-xl flex items-center justify-center mx-auto mb-4">
              <Route className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Planeje</h3>
            <p className="text-gray-600">
              Organize seus roteiros e acompanhe seus lugares visitados.
            </p>
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
            <p>&copy; 2024 ToGo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

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
