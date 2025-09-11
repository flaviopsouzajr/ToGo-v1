import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { PlaceWithType } from '@/../../shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';
import { MapPin, Clock, CheckCircle } from 'lucide-react';

// Configuração do ícone do marcador
const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PlaceWithCoordinates extends PlaceWithType {
  latitude?: number;
  longitude?: number;
}

// Função para geocodificar endereços usando Nominatim (OpenStreetMap)
async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const fullAddress = `${address}, ${city}, ${state}, Brasil`;
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`, {
      headers: {
        'User-Agent': 'ToGo App/1.0 (contact@example.com)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
    
    // Fallback: tentar apenas com cidade e estado
    const cityStateAddress = `${city}, ${state}, Brasil`;
    const cityResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityStateAddress)}&limit=1`, {
      headers: {
        'User-Agent': 'ToGo App/1.0 (contact@example.com)'
      }
    });
    
    if (!cityResponse.ok) {
      throw new Error(`HTTP error! status: ${cityResponse.status}`);
    }
    
    const cityData = await cityResponse.json();
    
    if (cityData && cityData.length > 0) {
      return {
        lat: parseFloat(cityData[0].lat),
        lon: parseFloat(cityData[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar:', error);
    return null;
  }
}

// Componente para ajustar o zoom e centralizar o mapa
function MapController({ places }: { places: PlaceWithCoordinates[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (places.length > 0) {
      const validPlaces = places.filter(p => p.latitude && p.longitude);
      
      if (validPlaces.length === 1) {
        // Se houver apenas um lugar, centralizar nele
        map.setView([validPlaces[0].latitude!, validPlaces[0].longitude!], 12);
      } else if (validPlaces.length > 1) {
        // Se houver múltiplos lugares, ajustar o zoom para mostrar todos
        const bounds = validPlaces.map(p => [p.latitude!, p.longitude!] as [number, number]);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [places, map]);
  
  return null;
}

export function PlacesMap() {
  const [placesWithCoords, setPlacesWithCoords] = useState<PlaceWithCoordinates[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { data: places = [], isLoading } = useQuery<PlaceWithType[]>({
    queryKey: ["/api/places"],
  });

  // Criar mapa básico do Brasil sem geocoding automático para evitar erros de fetch
  useEffect(() => {
    if (places.length > 0) {
      // Definir lugares sem coordenadas por enquanto para evitar erros de rede
      setPlacesWithCoords(places.map(place => ({
        ...place,
        latitude: undefined,
        longitude: undefined
      })));
      setIsGeocoding(false);
    }
  }, [places]);

  if (isLoading || isGeocoding) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-togo-primary mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoading ? 'Carregando lugares...' : 'Localizando endereços no mapa...'}
          </p>
        </div>
      </div>
    );
  }

  const validPlaces = placesWithCoords.filter(p => p.latitude && p.longitude);

  // Sempre mostrar o mapa, mesmo sem coordenadas dos lugares

  return (
    <div className="w-full h-[600px] relative">
      <MapContainer
        center={[-15.7801, -47.9292]} // Centro do Brasil (Brasília)
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController places={validPlaces} />
        
        {validPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude!, place.longitude!]}
            icon={markerIcon}
          >
            <Popup>
              <Card className="w-64 border-0 shadow-none">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{place.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {place.type.name}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{place.cityName}, {place.stateName}</span>
                    </div>
                    
                    {place.address && (
                      <p className="text-xs text-gray-500 truncate">{place.address}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <StarRating rating={place.rating || 0} size="sm" />
                      <div className="flex items-center gap-1 text-xs">
                        {place.isVisited ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-orange-500" />
                        )}
                        <span className="text-gray-600">
                          {place.isVisited ? 'Visitado' : 'Para visitar'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-600">Pet Friendly:</span>
                      <span className={place.petFriendly ? "text-green-600" : "text-red-600"}>
                        {place.petFriendly ? 'Sim 🐾' : 'Não'}
                      </span>
                    </div>
                    
                    {place.tags && place.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {place.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {place.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            +{place.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {placesWithCoords.length > 0 && validPlaces.length === 0 && (
        <div className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-togo-primary" />
            <span>
              <strong>{placesWithCoords.length}</strong> {placesWithCoords.length === 1 ? 'lugar cadastrado' : 'lugares cadastrados'} - Coordenadas não disponíveis
            </span>
          </div>
        </div>
      )}
    </div>
  );
}