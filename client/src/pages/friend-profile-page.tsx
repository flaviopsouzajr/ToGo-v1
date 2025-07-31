import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Star, Calendar, User, Heart } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Link } from "wouter";
import type { PlaceWithType } from "@shared/schema";

export function FriendProfilePage() {
  const { friendId } = useParams<{ friendId: string }>();
  const numericFriendId = parseInt(friendId || "0");

  // Fetch friend's recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/friends", numericFriendId, "recommendations"],
    enabled: !!numericFriendId,
  });

  // Get friend info from first recommendation if available
  const friendInfo = recommendations[0]?.createdByUser;

  if (recommendationsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando perfil do amigo...</div>
      </div>
    );
  }

  return (
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
              {friendInfo?.username || "Amigo"}
            </h1>
            <p className="text-gray-600">Indicações para Amigos</p>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((place) => (
              <Card 
                key={place.id} 
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
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
                        ${place.type.name === "Restaurante" ? "bg-togo-primary text-white" : ""}
                        ${place.type.name === "Ponto Turístico" ? "bg-togo-secondary text-white" : ""}
                        ${place.type.name === "Cidade" ? "bg-togo-light text-white" : ""}
                      `}
                    >
                      {place.type.name}
                    </Badge>
                    
                    <div className="flex gap-2">
                      {place.type.name === "Restaurante" && place.hasRodizio && (
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
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      {place.isVisited ? (
                        <>
                          <span className="text-togo-primary font-medium">Visitado</span>
                          <div className="w-2 h-2 bg-togo-primary rounded-full ml-2"></div>
                        </>
                      ) : (
                        <span className="text-gray-500 font-medium">Para visitar</span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(place.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  {place.instagramProfile && (
                    <div className="mt-3 pt-3 border-t">
                      <a 
                        href={`https://instagram.com/${place.instagramProfile.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600 text-sm"
                      >
                        {place.instagramProfile}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}