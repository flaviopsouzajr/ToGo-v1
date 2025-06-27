import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, Instagram } from "lucide-react";
import { StarRating } from "./star-rating";
import { PlaceWithType } from "@shared/schema";

interface PlaceCardProps {
  place: PlaceWithType;
}

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
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
        <div className="flex items-center justify-between mb-2">
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
          {place.type.name === "Restaurante" && place.hasRodizio && (
            <Badge variant="destructive" className="text-xs">
              Rodízio
            </Badge>
          )}
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
              {place.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {place.isVisited ? (
              <>
                <span className="text-togo-primary font-medium">Já visitei</span>
                <CheckCircle className="w-5 h-5 text-togo-primary" />
              </>
            ) : (
              <span className="text-gray-500 font-medium">Para visitar</span>
            )}
          </div>
          
          {place.instagramProfile && (
            <a 
              href={`https://instagram.com/${place.instagramProfile.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-600"
            >
              <Instagram className="w-5 h-5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
