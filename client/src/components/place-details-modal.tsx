import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { PlaceWithType } from "@shared/schema";
import { MapPin, Instagram, Clock, Check, X, Download, ExternalLink, FileText } from "lucide-react";
import placeholderImage from "@assets/generated_images/Travel_location_placeholder_image_5440c847.png";

interface PlaceDetailsModalProps {
  place: PlaceWithType | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaceDetailsModal({ place, isOpen, onClose }: PlaceDetailsModalProps) {
  if (!place) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-togo-primary">
            {place.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem Principal */}
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={place.mainImage || placeholderImage}
              alt={place.name}
              className="w-full h-64 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = placeholderImage;
              }}
            />
          </div>

          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-4">
              {/* Tipo do Lugar */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo</h3>
                <Badge variant="secondary" className="bg-togo-tertiary text-togo-primary">
                  {place.type.name}
                </Badge>
              </div>

              {/* Localização */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Localização</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{place.cityName}, {place.stateName}</span>
                  </div>
                  {place.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-togo-primary" />
                      <a
                        href={`https://www.google.com/maps/search/?q=${encodeURIComponent(place.address + ', ' + place.cityName + ', ' + place.stateName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-togo-primary hover:text-togo-secondary underline font-medium"
                      >
                        {place.address}
                      </a>
                      <ExternalLink className="h-3 w-3 text-togo-primary" />
                    </div>
                  )}
                </div>
              </div>

              {/* Instagram */}
              {place.instagramProfile && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Instagram</h3>
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    <a
                      href={`https://instagram.com/${place.instagramProfile.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-togo-primary hover:text-togo-secondary underline"
                    >
                      @{place.instagramProfile.replace('@', '')}
                    </a>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              )}

              {/* Status de Visita */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</h3>
                <div className="flex items-center space-x-2">
                  {place.isVisited ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Já visitado</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-600 dark:text-orange-400">Para visitar</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-4">
              {/* Avaliação */}
              {place.rating && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Avaliação</h3>
                  <div className="flex items-center space-x-2">
                    <StarRating rating={parseFloat(place.rating)} size="md" />
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {place.rating}/5
                    </span>
                  </div>
                </div>
              )}

              {/* Rodízio (apenas para restaurantes) */}
              {place.type.name === "Restaurante" && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Rodízio</h3>
                  <div className="flex items-center space-x-2">
                    {place.hasRodizio ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">Possui rodízio</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">Não possui rodízio</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Roteiro */}
              {place.itineraryFile && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Roteiro</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-togo-primary" />
                    <a
                      href={place.itineraryFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-togo-primary hover:text-togo-secondary underline font-medium"
                    >
                      Visualizar ou Baixar Roteiro
                    </a>
                    <ExternalLink className="h-3 w-3 text-togo-primary" />
                  </div>
                </div>
              )}

              {/* Pet Friendly */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Pet Friendly</h3>
                <div className="flex items-center space-x-2">
                  {place.petFriendly ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Sim 🐾</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">Não</span>
                    </>
                  )}
                </div>
              </div>

              {/* Tags */}
              {place.tags && place.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {place.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-togo-quaternary border-togo-primary text-togo-primary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Descrição */}
          {place.description && (
            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Descrição</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {place.description}
              </p>
            </div>
          )}

          {/* Botão de Fechar */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={onClose}
              className="bg-togo-primary hover:bg-togo-secondary"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}