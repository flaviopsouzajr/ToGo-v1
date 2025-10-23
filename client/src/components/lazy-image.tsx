import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

export function LazyImage({ 
  src, 
  alt, 
  placeholder, 
  className, 
  ...props 
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src) return;

    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoading(true);
            const image = new Image();
            
            image.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
              setIsError(false);
            };
            
            image.onerror = () => {
              setIsLoading(false);
              setIsError(true);
              if (placeholder) {
                setImageSrc(placeholder);
              }
            };
            
            image.src = src;
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(img);

    return () => {
      if (img) {
        observer.unobserve(img);
      }
    };
  }, [src, placeholder]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        className,
        isLoading && "animate-pulse bg-gray-200",
        isError && "opacity-50"
      )}
      {...props}
    />
  );
}
