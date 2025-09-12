import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = "md", 
  interactive = false,
  onRatingChange 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Normalize rating to nearest 0.5 for consistent display
  const normalizedRating = Math.round(rating * 2) / 2;
  
  // Estado para hover quando interativo
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
  // Usar hoverRating se estiver fazendo hover, senão usar o rating normalizado
  const displayRating = hoverRating !== null ? hoverRating : normalizedRating;

  const handleStarHover = (starNumber: number, isHalf: boolean = false) => {
    if (interactive) {
      const newRating = isHalf ? starNumber - 0.5 : starNumber;
      setHoverRating(newRating);
    }
  };

  const handleStarClick = (starNumber: number, isHalf: boolean = false) => {
    if (interactive && onRatingChange) {
      const newRating = isHalf ? starNumber - 0.5 : starNumber;
      onRatingChange(newRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className="flex items-center space-x-1" onMouseLeave={handleMouseLeave}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starNumber = index + 1;
        const filled = starNumber <= Math.floor(displayRating);
        const halfFilled = starNumber === Math.ceil(displayRating) && displayRating % 1 !== 0 && displayRating >= starNumber - 0.5;
        
        return (
          <div
            key={index}
            className={cn(
              sizeClasses[size],
              "relative text-yellow-400",
              interactive && "cursor-pointer"
            )}
          >
            {/* Star background (empty) */}
            <Star className="w-full h-full text-gray-300" />
            
            {/* Half filled star */}
            {halfFilled && (
              <Star 
                className="w-full h-full absolute top-0 left-0 fill-current text-yellow-400"
                style={{
                  clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                }}
              />
            )}
            
            {/* Full filled star */}
            {filled && (
              <Star className="w-full h-full absolute top-0 left-0 fill-current text-yellow-400" />
            )}
            
            {/* Interactive hover and click areas */}
            {interactive && (
              <>
                {/* Left half for .5 rating */}
                <button
                  type="button"
                  onMouseEnter={() => handleStarHover(starNumber, true)}
                  onClick={() => handleStarClick(starNumber, true)}
                  className="absolute top-0 left-0 w-1/2 h-full z-10 hover:scale-110 transition-transform"
                  style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
                />
                {/* Right half for full rating */}
                <button
                  type="button"
                  onMouseEnter={() => handleStarHover(starNumber, false)}
                  onClick={() => handleStarClick(starNumber, false)}
                  className="absolute top-0 right-0 w-1/2 h-full z-10 hover:scale-110 transition-transform"
                  style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
                />
              </>
            )}
          </div>
        );
      })}
      {displayRating > 0 && (
        <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {displayRating.toFixed(1)}/5
        </span>
      )}
    </div>
  );
}