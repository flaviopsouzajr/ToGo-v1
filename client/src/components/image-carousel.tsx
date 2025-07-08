import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CarouselImage } from "@shared/schema";

// Função para converter URL do Google Drive para formato de exibição
function convertGoogleDriveUrl(url: string): string {
  // Verifica se é URL do Google Drive
  if (url.includes('drive.google.com')) {
    // Diferentes padrões de URL do Google Drive
    let fileId = '';
    
    // Padrão 1: /file/d/ID/view
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      fileId = match[1];
    }
    
    // Padrão 2: id= na query string
    if (!fileId) {
      match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) {
        fileId = match[1];
      }
    }
    
    // Padrão 3: URL já no formato de exibição
    if (url.includes('drive.google.com/uc?')) {
      return url;
    }
    
    if (fileId) {
      // Tenta diferentes formatos de URL do Google Drive
      // Formato 1: uc?export=view&id=
      // Formato 2: uc?id= (alternativa que pode funcionar melhor)
      return `https://drive.google.com/uc?id=${fileId}`;
    }
  }
  // Retorna URL original se não for do Google Drive
  return url;
}

export function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const { data: images = [], isLoading } = useQuery<CarouselImage[]>({
    queryKey: ["/api/carousel-images"],
  });

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-64 md:h-80 mb-8">
        <CardContent className="p-0 h-full">
          <div className="w-full h-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
            <div className="text-gray-500">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return null; // Don't show carousel if no images
  }

  const currentImage = images[currentIndex];
  
  const handleImageError = (imageId: number) => {
    console.log(`Erro ao carregar imagem ${imageId}:`, currentImage.imageUrl);
    console.log('URL convertida:', convertGoogleDriveUrl(currentImage.imageUrl));
    setImageErrors(prev => new Set(prev).add(imageId));
  };

  // Debug: log da conversão para ver se está funcionando
  console.log('Carrossel - Imagem atual:', currentImage);
  console.log('Carrossel - URL convertida:', convertGoogleDriveUrl(currentImage.imageUrl));

  return (
    <Card className="w-full h-64 md:h-80 mb-8 overflow-hidden">
      <CardContent className="p-0 h-full relative">
        <div className="relative w-full h-full">
          {imageErrors.has(currentImage.id) ? (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-sm">Erro ao carregar imagem</p>
                <p className="text-xs mt-1">Verifique a URL da imagem</p>
              </div>
            </div>
          ) : (
            <img
              src={convertGoogleDriveUrl(currentImage.imageUrl)}
              alt={currentImage.title || "Carousel image"}
              className="w-full h-full object-cover"
              onError={() => handleImageError(currentImage.id)}
            />
          )}
          
          {/* Overlay with title and description */}
          {(currentImage.title || currentImage.description) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
              {currentImage.title && (
                <h3 className="text-white text-xl font-semibold mb-2">
                  {currentImage.title}
                </h3>
              )}
              {currentImage.description && (
                <p className="text-white/90 text-sm">
                  {currentImage.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}