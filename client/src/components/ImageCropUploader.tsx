import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload, Crop, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImageCropUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string, thumbnailUrl?: string) => void;
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Função para criar um canvas recortado
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

// Função para obter o canvas recortado
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CropArea,
  targetWidth: number = 800,
  quality: number = 0.8
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível obter o contexto do canvas");
  }

  // Calcular dimensões mantendo proporção
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = targetWidth * pixelRatio;
  canvas.height = (pixelCrop.height * targetWidth / pixelCrop.width) * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    targetWidth,
    pixelCrop.height * targetWidth / pixelCrop.width
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, "image/jpeg", quality);
  });
};

export function ImageCropUploader({
  currentImageUrl,
  onImageUploaded,
  aspectRatio = 16 / 9,
  maxWidth = 800,
  maxHeight = 600,
  className = "",
}: ImageCropUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || "");
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadImages = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
      // Criar imagem cropada para envio
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 1600, 0.9);
      
      // Converter para base64 para envio
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(croppedBlob);
      });
      
      const imageBlob = await base64Promise;

      // Upload via endpoint que processa e cria duas versões
      const result = await apiRequest("/api/place-images/upload", {
        method: "POST",
        body: { imageBlob }
      });

      // Notificar o formulário com ambas as URLs
      onImageUploaded(result.standardPath, result.thumbnailPath);
      
      toast({
        title: "Imagem enviada com sucesso!",
        description: "A imagem foi otimizada e está pronta para uso.",
      });

      setShowCropModal(false);
      setSelectedFile(null);
      setImageSrc("");
      
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        {currentImageUrl && (
          <div className="relative">
            <img
              src={currentImageUrl}
              alt="Imagem atual"
              className="w-20 h-20 object-cover rounded-md border"
            />
          </div>
        )}
        
        <div className="flex-1">
          <Input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button type="button" variant="outline" className="w-full" asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>
                  {currentImageUrl ? "Alterar Imagem" : "Adicionar Imagem"}
                </span>
              </div>
            </Button>
          </label>
        </div>
      </div>

      {/* Modal de Crop */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Crop className="w-5 h-5" />
              <span>Ajustar Foco da Imagem</span>
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <div className="relative h-96 bg-gray-100 rounded-md overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: {
                      backgroundColor: "#f3f4f6",
                    },
                  }}
                />
              )}
            </div>
            
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCropModal(false)}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={uploadImages}
              disabled={isUploading}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isUploading ? "Enviando..." : "Salvar Imagem"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}