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
    queryKey: ["/api/places/public"],
  });

  // Função auxiliar para obter coordenadas do estado
  const getStateCoordinates = (state: string) => {
    const stateCoordinates: Record<string, [number, number]> = {
      'Acre': [-8.77, -70.55],
      'Alagoas': [-9.71, -35.73],
      'Amapá': [1.41, -51.77],
      'Amazonas': [-3.07, -61.66],
      'Bahia': [-12.96, -38.51],
      'Ceará': [-3.71, -38.54],
      'Distrito Federal': [-15.83, -47.86],
      'Espírito Santo': [-19.19, -40.34],
      'Goiás': [-16.64, -49.31],
      'Maranhão': [-2.55, -44.30],
      'Mato Grosso': [-12.64, -55.42],
      'Mato Grosso do Sul': [-20.51, -54.54],
      'Minas Gerais': [-18.10, -44.38],
      'Pará': [-5.53, -52.29],
      'Paraíba': [-7.06, -35.55],
      'Paraná': [-24.89, -51.55],
      'Pernambuco': [-8.28, -35.07],
      'Piauí': [-8.28, -43.68],
      'Rio de Janeiro': [-22.84, -43.15],
      'Rio Grande do Norte': [-5.22, -36.52],
      'Rio Grande do Sul': [-30.01, -51.22],
      'Rondônia': [-11.22, -62.80],
      'Roraima': [1.89, -61.22],
      'Santa Catarina': [-27.33, -49.44],
      'São Paulo': [-23.55, -46.64],
      'Sergipe': [-10.90, -37.07],
      'Tocantins': [-10.25, -48.25]
    };
    
    const coords = stateCoordinates[state];
    if (coords) {
      const [lat, lng] = coords;
      const variation = 0.5;
      return {
        lat: lat + (Math.random() - 0.5) * variation,
        lon: lng + (Math.random() - 0.5) * variation
      };
    }
    return null;
  };

  // Função para fazer geocoding usando nossa API backend
  const geocodeAddress = async (address: string | null, city: string, state: string) => {
    console.log(`Geocoding: "${address}" in ${city}, ${state}`);
    
    // Se não há endereço específico, ir direto para cidade ou estado
    if (!address || address.trim() === '') {
      console.log(`No specific address for ${city}, ${state} - trying city geocoding first`);
      
      // Tentar geocoding da cidade
      try {
        const cityParams = new URLSearchParams({
          address: `${city}, ${state}, Brasil`,
          city,
          state
        });
        
        const cityResponse = await fetch(`/api/geocode?${cityParams}`);
        if (cityResponse.ok) {
          const cityData = await cityResponse.json();
          if (cityData.lat && cityData.lon) {
            console.log(`✅ City geocoding successful for ${city}, ${state}`);
            return { lat: cityData.lat, lon: cityData.lon };
          }
        }
      } catch (error) {
        console.warn(`City geocoding error for ${city}, ${state}:`, error);
      }
      
      // Se geocoding da cidade falhar, usar coordenadas fixas do estado
      console.log(`City geocoding failed for ${city}, ${state} - using state coordinates`);
      const stateCoords = getStateCoordinates(state);
      if (stateCoords) {
        console.log(`✅ Using state coordinates for ${city}, ${state}`);
        return stateCoords;
      }
      
      // Se nem estado funcionar, coordenadas padrão do Brasil
      console.warn(`State coordinates not found for ${state} - using Brazil center`);
      return { lat: -15.7801, lon: -47.9292 }; // Brasília
    }

    try {
      // Tentar primeiro com endereço completo
      console.log(`Trying full address geocoding for: ${address}`);
      const params = new URLSearchParams({
        address: `${address}, ${city}, ${state}, Brasil`,
        city,
        state
      });
      
      const response = await fetch(`/api/geocode?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.lat && data.lon) {
          console.log(`✅ Address geocoding successful for ${address}`);
          return { lat: data.lat, lon: data.lon };
        }
      }
      
      // Se falhar, tentar só com cidade + estado
      console.log(`Address geocoding failed, trying city fallback for ${city}, ${state}`);
      const fallbackParams = new URLSearchParams({
        address: `${city}, ${state}, Brasil`,
        city,
        state
      });
      
      const fallbackResponse = await fetch(`/api/geocode?${fallbackParams}`);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.lat && fallbackData.lon) {
          console.log(`✅ City fallback geocoding successful for ${city}, ${state}`);
          return { lat: fallbackData.lat, lon: fallbackData.lon };
        }
      }
      
      // Como último recurso, usar coordenadas do estado
      console.warn(`All geocoding failed for ${address}, ${city}, ${state} - using state coordinates`);
      const stateCoords = getStateCoordinates(state);
      if (stateCoords) {
        console.log(`✅ Using state coordinates as final fallback`);
        return stateCoords;
      }
      
      // Último último recurso: Brasil
      console.warn(`Even state coordinates failed - using Brazil center`);
      return { lat: -15.7801, lon: -47.9292 }; // Brasília
      
    } catch (error) {
      console.warn(`Geocoding error for ${address}, ${city}, ${state}:`, error);
      const stateCoords = getStateCoordinates(state);
      return stateCoords || { lat: -15.7801, lon: -47.9292 };
    }
  };

  // Geocodificar endereços quando os lugares forem carregados (com delay para evitar rate limit)
  useEffect(() => {
    if (places.length > 0) {
      setIsGeocoding(true);
      
      // Processar lugares um de cada vez com delay para evitar rate limit
      const processPlacesSequentially = async () => {
        const processedPlaces: PlaceWithCoordinates[] = [];
        
        for (let i = 0; i < places.length; i++) {
          const place = places[i];
          try {
            console.log(`Processing place ${i + 1}/${places.length}: ${place.name}`);
            const coords = await geocodeAddress(place.address, place.cityName, place.stateName);
            
            processedPlaces.push({
              ...place,
              latitude: coords?.lat,
              longitude: coords?.lon
            });
            
            // Delay de 500ms entre chamadas para evitar rate limit
            if (i < places.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (error) {
            console.error(`Erro ao geocodificar ${place.name}:`, error);
            processedPlaces.push({
              ...place,
              latitude: undefined,
              longitude: undefined
            });
          }
        }
        
        setPlacesWithCoords(processedPlaces);
        setIsGeocoding(false);
      };
      
      processPlacesSequentially().catch((error) => {
        console.error('Erro geral na geocodificação:', error);
        setPlacesWithCoords(places.map(place => ({
          ...place,
          latitude: undefined,
          longitude: undefined
        })));
        setIsGeocoding(false);
      });
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

  const validPlaces = placesWithCoords.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));

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
                      <StarRating rating={Number(place.rating || 0)} size="sm" />
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