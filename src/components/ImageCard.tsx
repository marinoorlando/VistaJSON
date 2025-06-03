
import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FoundImage } from '@/types';
import { Link2, Info } from 'lucide-react';
import { getParentObject } from '@/lib/json-utils';


interface ImageCardProps {
  image: FoundImage;
  parsedJsonData: any | null;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, parsedJsonData }) => {
  const [hasError, setHasError] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailObject, setDetailObject] = useState<any>(null);
  const [detailObjectPath, setDetailObjectPath] = useState<string>("");

  useEffect(() => {
    setHasError(false);
  }, [image.value]);

  const handleViewDetails = () => {
    if (!parsedJsonData) return;

    const parentObj = getParentObject(parsedJsonData, image.jsonPath);
    if (parentObj) {
      setDetailObject(parentObj);

      const pathSegments = image.jsonPath.replace(/\[(\d+)\]/g, '.$1').split('.');
      let parentDisplayPath = "Objeto Raíz"; // Default for root or unresolvable parent path for display
      if (pathSegments.length > 1) {
        pathSegments.pop(); // Remove the image field name itself
        parentDisplayPath = pathSegments.join('.').replace(/\.(\d+)/g, '[$1]'); // Restore array notation
      }
      setDetailObjectPath(parentDisplayPath);
      setIsDetailModalOpen(true);
    } else {
      // Fallback if parent object can't be determined
      setDetailObject({ error: "No se pudo determinar el objeto contenedor." });
      setDetailObjectPath(image.jsonPath); // Show the full path as context
      setIsDetailModalOpen(true);
    }
  };


  const isAbsoluteUrl = image.type === 'url' && (image.value.startsWith('http://') || image.value.startsWith('https://'));
  const isDataUri = image.type === 'dataUri';

  let imageContent;

  if (isDataUri) {
    if (hasError) {
      imageContent = (
        <div className="flex items-center justify-center h-full w-full bg-muted text-destructive-foreground p-2 text-center text-xs" data-ai-hint="error message">
          Error al cargar Data URI de: {image.jsonPath}. Verifique el formato en el archivo JSON.
        </div>
      );
    } else {
      imageContent = (
        <img
          src={image.value}
          alt={`Imagen Data URI de ${image.jsonPath}`}
          className="object-contain w-full h-full"
          data-ai-hint="embedded illustration"
          onError={() => setHasError(true)}
        />
      );
    }
  } else if (isAbsoluteUrl) {
    imageContent = (
      <NextImage
        src={image.value}
        alt={`Imagen de ${image.jsonPath}`}
        fill
        className="object-contain"
        data-ai-hint="digital art"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.srcset = 'https://placehold.co/300x200.png?text=Error+Al+Cargar';
          target.src = 'https://placehold.co/300x200.png?text=Error+Al+Cargar';
        }}
      />
    );
  } else {
    // For 'url' types that are not absolute (e.g., relative paths, malformed) or if type is somehow else
    imageContent = (
      <img
        src="https://placehold.co/300x200.png?text=Ruta+Inválida"
        alt={`Ruta inválida o tipo no manejado para ${image.jsonPath}`}
        className="object-contain w-full h-full"
        data-ai-hint="broken link placeholder"
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium truncate font-code" title={image.jsonPath}>
          Ruta: {image.jsonPath}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 aspect-video relative bg-muted/20">
        {imageContent}
      </CardContent>
      <CardFooter className="p-2 bg-secondary/20">
        <div className="flex justify-between items-center w-full">
          <CardDescription className="text-xs truncate flex items-center mr-2" title={image.value}>
            <Link2 className="h-3 w-3 mr-1 shrink-0" />
            {image.value.length > 70 ? `${image.value.substring(0, 67)}...` : image.value}
          </CardDescription>
          <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Ver detalles del objeto JSON" onClick={handleViewDetails}>
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[90vw]">
              <DialogHeader>
                <DialogTitle>Detalles del Objeto Contenedor</DialogTitle>
                <DialogDescription>
                  Mostrando el objeto JSON que contiene la imagen. Ruta del objeto: <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{detailObjectPath}</code>
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] mt-4 border rounded-md">
                <pre className="text-sm bg-card p-3 font-code overflow-auto">
                  <code>{detailObject ? JSON.stringify(detailObject, null, 2) : "No hay datos para mostrar."}</code>
                </pre>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ImageCard;
