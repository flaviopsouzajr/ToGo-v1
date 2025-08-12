import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from "lucide-react";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface ImageCropperProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

// Utility function to create canvas and crop image
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const maxSize = Math.max(pixelCrop.width, pixelCrop.height);
      
      canvas.width = maxSize;
      canvas.height = maxSize;

      ctx.translate(maxSize / 2, maxSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-maxSize / 2, -maxSize / 2);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        maxSize,
        maxSize
      );

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/jpeg', 0.9);
    };
    
    image.onerror = () => reject(new Error('Failed to load image'));
  });
};

export function ImageCropper({ imageSrc, isOpen, onClose, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels) return;
    
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      console.log("ImageCropper: calling onCropComplete with blob size:", croppedImage.size);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  if (!imageSrc || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ZoomIn className="w-5 h-5 mr-2" />
            Ajustar Foto de Perfil
          </DialogTitle>
          <DialogDescription>
            Use os controles abaixo para ajustar o enquadramento da sua foto de perfil
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cropper Area */}
          <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              rotation={rotation}
              zoom={zoom}
              aspect={1}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              cropShape="round"
              showGrid={true}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  position: 'relative'
                }
              }}
            />
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Zoom</span>
              <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <ZoomOut className="w-4 h-4 text-gray-400" />
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rotação</span>
              <span className="text-sm text-gray-500">{rotation}°</span>
            </div>
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-gray-400" />
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <RotateCcw className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 text-center">
            Arraste a imagem para posicionar, use zoom e rotação para ajustar o enquadramento
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetCrop}
            className="flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCrop}
              disabled={isProcessing}
              className="bg-togo-primary hover:bg-togo-primary/90"
            >
              <Check className="w-4 h-4 mr-2" />
              {isProcessing ? "Processando..." : "Salvar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}