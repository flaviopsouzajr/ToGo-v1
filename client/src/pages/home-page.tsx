import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { PlaceCard } from "@/components/place-card";
import { PlaceDetailsModal } from "@/components/place-details-modal";
import { ImageCarousel } from "@/components/image-carousel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, MapPin, Star, Route, LogIn } from "lucide-react";
import { Link } from "wouter";
import { PlaceWithType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { user } = useAuth();

  const { data: places = [], isLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/places"],
    enabled: !!user, // Só executa se o usuário estiver logado
  });

  const { data: stats } = useQuery<{
    totalPlaces: number;
    visited: number;
    toVisit: number;
  }>({
    queryKey: ["/api/stats"],
    enabled: !!user, // Só executa se o usuário estiver logado
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
            {user ? (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  Bem-vindo, {user.name || user.username}!
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200">
                  Gerencie seus lugares favoritos e descubra novas experiências
                  únicas.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-togo-primary hover:bg-togo-secondary"
                >
                  <Link href="/places">
                    Meus Lugares
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  Bem-vindo ao ToGo
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-gray-200">
                  O sistema para organizar e planejar seus lugares favoritos
                  para visitar. Faça login para cadastrar, gerenciar e explorar
                  seus próprios registros.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-togo-primary hover:bg-togo-secondary"
                >
                  <Link href="/auth">
                    Fazer Login
                    <LogIn className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Image Carousel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImageCarousel />
      </div>
      {/* Featured Places - Só aparece para usuários logados */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Seus Lugares em Destaque
            </h2>
            <p className="text-xl text-gray-600">
              Os lugares que você cadastrou com as melhores avaliações
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
                Comece cadastrando seu primeiro lugar incrível!
              </p>
              <Button asChild className="mt-4">
                <Link href="/places">Cadastrar Lugar</Link>
              </Button>
            </div>
          )}
        </div>
      )}
      {/* Statistics - Só aparece para usuários logados */}
      {user && stats && (
        <div className="bg-togo-lightest py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Seus Números
              </h2>
              <p className="text-lg text-gray-600">
                Acompanhe seu progresso de descobertas
              </p>
            </div>
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
          <h2 className="text-4xl font-bold mb-4 text-[#111827] bg-[transparent]">
            ToGo, cada lugar se torna uma nova aventura esperando para ser
            explorada.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-togo-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Explore</h3>
            <p className="text-gray-600">Encontre  restaurantes, pontos turísticos e experiências que valem a visita.</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-togo-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Avalie & Compartilhe</h3>
            <p className="text-gray-600">Dê sua opinião e ajude outos goers a decidirem onde ir.</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-togo-light rounded-xl flex items-center justify-center mx-auto mb-4">
              <Route className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gerencie</h3>
            <p className="text-gray-600">Organize suas lista de lugares e acompanhe suas visitas.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-togo-lightest rounded-xl p-8 mt-12 text-center">
          <h3 className="text-2xl font-bold text-togo-primary mb-4">
            Descubra, Explore e Compartilhe
          </h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Junte-se a uma comunidade que valoriza experiências únicas e descobertas incríveis. 
            Com o ToGo, cada lugar se torna uma nova aventura esperando para ser explorada.
          </p>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="md:max-w-md">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-togo-primary rounded-lg flex items-center justify-center">
                  <MapPin className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-bold">ToGo</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Sua plataforma completa para descobrir e catalogar os melhores
                lugares para visitar em todo o Brasil.
              </p>
            </div>

            <div className="md:text-right text-justify">
              <h4 className="font-semibold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>contato@togo.com.br</li>
                <li>(11) 9999-9999</li>
                <li>São Paulo, SP</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>© 2025 ToGo. Todos os direitos reservados.</p>
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
