import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, Upload, Check, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  onImageUpdate: (croppedImageBlob: Blob) => Promise<void>;
  isUploading: boolean;
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

export function ProfileImageUploader({ currentImageUrl, onImageUpdate, isUploading }: ProfileImageUploaderProps) {
  const [showFileInput, setShowFileInput] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecione um arquivo de imagem válido.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    console.log("Selected file:", file.name, file.type, file.size);
    setSelectedFile(file);

    // Convert to data URL for cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      console.log("FileReader converted to data URL, length:", dataUrl.length);
      setImageDataUrl(dataUrl);
      setShowCropper(true);
    };
    reader.onerror = () => {
      console.error("FileReader error");
      alert('Erro ao ler o arquivo de imagem.');
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels || !imageDataUrl) return;
    
    setIsProcessing(true);
    try {
      console.log("Starting crop process with data URL");
      const croppedImage = await getCroppedImg(
        imageDataUrl,
        croppedAreaPixels,
        rotation
      );
      console.log("Cropped image blob created, size:", croppedImage.size);
      
      setShowCropper(false);
      await onImageUpdate(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
    setImageDataUrl("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
        disabled={isUploading}
      >
        <div className="flex items-center justify-center">
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          {isUploading ? "Processando..." : "Alterar Foto"}
        </div>
      </Button>

      <p className="text-xs text-gray-500">
        JPG, PNG ou WebP. Máximo 5MB.
        <br />
        Você poderá ajustar o enquadramento após selecionar a imagem.
      </p>

      {/* Cropper Modal */}
      <Dialog open={showCropper} onOpenChange={handleCancel}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ZoomIn className="w-5 h-5 mr-2" />
              Ajustar Foto de Perfil
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Cropper Area */}
            <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
              {imageDataUrl && (
                <Cropper
                  image={imageDataUrl}
                  crop={crop}
                  rotation={rotation}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
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
              )}
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

            <p className="text-xs text-gray-500 text-center">
              Arraste a imagem para posicionar, use zoom e rotação para ajustar o enquadramento
            </p>
          </div>

          <DialogFooter className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCrop}
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}