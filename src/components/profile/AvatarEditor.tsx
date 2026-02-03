"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Move } from "lucide-react";

interface AvatarEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onSave: (file: File, position: { x: number; y: number }) => void;
  onCancel: () => void;
}

export default function AvatarEditor({
  open,
  onOpenChange,
  imageFile,
  onSave,
  onCancel,
}: AvatarEditorProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Porcentajes (50% = centro)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 50, y: 50 });

  // Cargar la imagen cuando cambie el archivo
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
      // Resetear posición al cargar nueva imagen
      setPosition({ x: 50, y: 50 });
    }
  }, [imageFile]);

  // Calcular límites de arrastre basados en el tamaño de la imagen
  const getDragLimits = () => {
    if (!containerRef.current || !imageRef.current) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }

    const container = containerRef.current;
    const img = imageRef.current;
    const containerSize = container.clientWidth;
    
    // Obtener dimensiones naturales de la imagen
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;
    
    if (imgNaturalWidth === 0 || imgNaturalHeight === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    }
    
    // Calcular escala de la imagen (object-fit: cover mantiene proporción)
    const containerAspect = 1; // Es circular, así que 1:1
    const imgAspect = imgNaturalWidth / imgNaturalHeight;
    
    let scaledWidth: number;
    let scaledHeight: number;
    
    if (imgAspect > containerAspect) {
      // Imagen más ancha que el contenedor - se escala por altura
      scaledHeight = containerSize;
      scaledWidth = containerSize * imgAspect;
    } else {
      // Imagen más alta que el contenedor - se escala por ancho
      scaledWidth = containerSize;
      scaledHeight = containerSize / imgAspect;
    }
    
    // Calcular márgenes (cuánto puede moverse la imagen)
    // Permitir movimiento hasta que los bordes de la imagen toquen los bordes del contenedor
    // object-position usa porcentajes basados en el tamaño de la imagen, no del contenedor
    const excessWidth = scaledWidth - containerSize;
    const excessHeight = scaledHeight - containerSize;
    
    // Convertir a porcentajes para object-position
    // object-position: 0% significa que el borde izquierdo/superior de la imagen está alineado
    // object-position: 100% significa que el borde derecho/inferior está alineado
    const maxOffsetX = excessWidth > 0 ? (excessWidth / scaledWidth) * 100 : 0;
    const maxOffsetY = excessHeight > 0 ? (excessHeight / scaledHeight) * 100 : 0;
    
    return {
      minX: Math.max(0, 50 - maxOffsetX),
      maxX: Math.min(100, 50 + maxOffsetX),
      minY: Math.max(0, 50 - maxOffsetY),
      maxY: Math.min(100, 50 + maxOffsetY),
    };
  };

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Calcular el desplazamiento del mouse desde donde empezó el arrastre
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    // Convertir píxeles a porcentajes del contenedor
    const containerSize = rect.width;
    const percentX = (deltaX / containerSize) * 100;
    const percentY = (deltaY / containerSize) * 100;
    
    const limits = getDragLimits();
    
    // Para hacer el arrastre intuitivo estilo drag and drop:
    // Cuando arrastras hacia la derecha, la imagen se mueve hacia la derecha (muestra más de la izquierda = disminuir X)
    // Cuando arrastras hacia abajo, la imagen se mueve hacia abajo
    // object-position funciona así: Y=0% muestra arriba, Y=100% muestra abajo
    // Para que sea intuitivo: arrastrar abajo = imagen baja = aumentar Y para mostrar más de abajo
    // Pero si está invertido, probamos con signo negativo
    const newX = Math.max(limits.minX, Math.min(limits.maxX, positionStartRef.current.x - percentX));
    // Invertimos Y: arrastrar abajo (deltaY positivo) = disminuir Y = mostrar más de arriba = imagen "baja" visualmente
    const newY = Math.max(limits.minY, Math.min(limits.maxY, positionStartRef.current.y - percentY));
    
    setPosition({
      x: newX,
      y: newY,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    // Guardar la posición absoluta del mouse cuando empieza el arrastre
    const startPos = {
      x: e.clientX,
      y: e.clientY,
    };
    setDragStart(startPos);
    dragStartRef.current = startPos;
    // Guardar la posición inicial de la imagen
    positionStartRef.current = { ...position };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updatePosition(e.clientX, e.clientY);
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    // Guardar la posición absoluta del touch cuando empieza el arrastre
    const startPos = {
      x: touch.clientX,
      y: touch.clientY,
    };
    setDragStart(startPos);
    dragStartRef.current = startPos;
    // Guardar la posición inicial de la imagen
    positionStartRef.current = { ...position };
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  }, [isDragging, updatePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleSave = () => {
    if (imageFile) {
      onSave(imageFile, position);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setPosition({ x: 50, y: 50 });
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Arrastra la imagen para ajustar su posición. La imagen se mostrará en un círculo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div
              ref={containerRef}
              className={`relative w-64 h-64 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300 select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ touchAction: "none" }}
            >
              {imageSrc && (
                <Image
                  ref={imageRef}
                  src={imageSrc}
                  alt="Preview"
                  fill
                  className="object-cover"
                  style={{
                    objectPosition: `${position.x}% ${position.y}%`,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                  unoptimized
                />
              )}
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <Move className="w-8 h-8 text-white opacity-50" />
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center">
            <p>Arrastra la imagen para centrarla correctamente</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!imageFile}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
