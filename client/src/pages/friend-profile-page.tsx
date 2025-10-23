import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Star, User, Heart, Copy, Info } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { StarRating } from "@/components/star-rating";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navigation } from "@/components/navigation";
import type { PlaceWithType, User as UserType } from "@shared/schema";

export function FriendProfilePage() {
  const { friendId } = useParams<{ friendId: string }>();
  const numericFriendId = parseInt(friendId || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithType | null>(null);

  // Fetch friend's user info
  const { data: friendUser, isLoading: userLoading, error: userError } = useQuery<UserType>({
    queryKey: ["/api/users", numericFriendId],
    queryFn: () => apiRequest(`/api/users/${numericFriendId}`),
    enabled: !!numericFriendId,
  });

  // Fetch friend's recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading, error: recommendationsError } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/friends", numericFriendId, "recommendations"],
    queryFn: () => apiRequest(`/api/friends/${numericFriendId}/recommendations`),
    enabled: !!numericFriendId,
  });

  // Clone place mutation
  const clonePlaceMutation = useMutation({
    mutationFn: async (placeId: number) => {
      return apiRequest(`/api/places/${placeId}/clone`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({
        title: "Lugar clonado com sucesso!",
        description: "O lugar foi adicionado à sua lista com avaliação zerada e como não visitado.",
        duration: 4000,
      });
    },
    onError: (error: any) => {
      // Extract the actual error message from the response
      let errorMessage = "Não foi possível clonar o lugar.";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Não foi possível clonar",
        description: errorMessage,
        variant: "destructive",
        duration: 6000, // Show for 6 seconds
      });
    },
  });

  if (userLoading || recommendationsLoading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Carregando perfil do amigo...</div>
        </div>
      </>
    );
  }

  if (recommendationsError) {
    console.error("Recommendations error:", recommendationsError);
  }

  if (userError) {
    console.error("User error:", userError);
  }

  console.log("Friend user data:", friendUser);
  console.log("Numeric friend ID:", numericFriendId);
  console.log("Friend username:", friendUser?.username);

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/friends">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Amigos
          </Button>
        </Link>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-togo-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              @{friendUser?.username || "Carregando..."} — Indicações para Amigos
            </h1>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Indicações para Amigos ({recommendations.length})
        </h2>

        {recommendations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma indicação ainda
              </h3>
              <p className="text-gray-600">
                Este amigo ainda não marcou lugares como "Indicação para Amigos".
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-6xl">
            {recommendations.map((place) => (
              <Card 
                key={place.id} 
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedPlace(place)}
              >
                {place.mainImage && (
                  <img 
                    src={place.mainImage} 
                    alt={place.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                {!place.mainImage && (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant="secondary" 
                      className={`
                        ${place.type?.name === "Restaurante" ? "bg-togo-primary text-white" : ""}
                        ${place.type?.name === "Ponto Turístico" ? "bg-togo-secondary text-white" : ""}
                        ${place.type?.name === "Cidade" ? "bg-togo-light text-white" : ""}
                      `}
                    >
                      {place.type?.name || 'Tipo não definido'}
                    </Badge>
                    
                    <div className="flex gap-2">
                      {place.type?.name === "Restaurante" && place.hasRodizio && (
                        <Badge variant="destructive" className="text-xs">
                          Rodízio
                        </Badge>
                      )}
                      {place.petFriendly && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Pet Friendly 🐾
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {place.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {place.cityName}, {place.stateName}
                  </p>
                  
                  {place.rating && (
                    <div className="mb-3">
                      <StarRating rating={parseFloat(place.rating)} />
                    </div>
                  )}
                  
                  {place.description && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                      {place.description}
                    </p>
                  )}
                  
                  {place.tags && place.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {place.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {place.tags.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{place.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {place.instagramProfile && (
                    <div className="mt-3 pt-3 border-t">
                      <a 
                        href={`https://instagram.com/${place.instagramProfile.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600 text-sm flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SiInstagram className="w-4 h-4" />
                        {place.instagramProfile}
                      </a>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlace(place);
                      }}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal de Detalhes do Lugar */}
      {selectedPlace && (
        <Dialog open={!!selectedPlace} onOpenChange={() => setSelectedPlace(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {selectedPlace.name}
              </DialogTitle>
              <DialogDescription>
                Detalhes do lugar indicado pelo seu amigo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Imagem */}
              {selectedPlace.mainImage && (
                <div className="w-full h-64 overflow-hidden rounded-lg">
                  <img 
                    src={selectedPlace.mainImage} 
                    alt={selectedPlace.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`
                      ${selectedPlace.type?.name === "Restaurante" ? "bg-togo-primary text-white" : ""}
                      ${selectedPlace.type?.name === "Ponto Turístico" ? "bg-togo-secondary text-white" : ""}
                      ${selectedPlace.type?.name === "Cidade" ? "bg-togo-light text-white" : ""}
                    `}
                  >
                    {selectedPlace.type?.name || 'Tipo não definido'}
                  </Badge>
                  
                  <div className="flex gap-2">
                    {selectedPlace.type?.name === "Restaurante" && selectedPlace.hasRodizio && (
                      <Badge variant="destructive" className="text-xs">
                        Rodízio
                      </Badge>
                    )}
                    {selectedPlace.petFriendly && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        Pet Friendly 🐾
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">{selectedPlace.cityName}, {selectedPlace.stateName}</span>
                </div>
                
                {selectedPlace.address && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <strong>Endereço:</strong> {selectedPlace.address}
                  </p>
                )}
                
                {selectedPlace.rating && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Avaliação:</span>
                    <StarRating rating={parseFloat(selectedPlace.rating)} />
                  </div>
                )}
                
                {selectedPlace.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descrição:</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedPlace.description}
                    </p>
                  </div>
                )}
                
                {selectedPlace.tags && selectedPlace.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlace.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedPlace.instagramProfile && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instagram:</h4>
                    <a 
                      href={`https://instagram.com/${selectedPlace.instagramProfile.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-600 font-medium"
                    >
                      {selectedPlace.instagramProfile}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Botão Clonar */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    clonePlaceMutation.mutate(selectedPlace.id);
                    setSelectedPlace(null);
                  }}
                  disabled={clonePlaceMutation.isPending}
                  className="w-full bg-togo-primary hover:bg-togo-secondary text-lg py-3"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  {clonePlaceMutation.isPending ? "Clonando..." : "Clonar Lugar"}
                </Button>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  O lugar será adicionado à sua lista com avaliação zerada e como não visitado.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </>
  );
}