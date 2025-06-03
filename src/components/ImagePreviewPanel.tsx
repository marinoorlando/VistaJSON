import type React from 'react';
import type { FoundImage } from '@/types';
import ImageCard from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, SearchSlash } from 'lucide-react';

interface ImagePreviewPanelProps {
  images: FoundImage[];
  isLoading: boolean;
  jsonSelected: boolean;
}

const ImagePreviewPanel: React.FC<ImagePreviewPanelProps> = ({ images, isLoading, jsonSelected }) => {
  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center">
          <ImageIcon className="mr-2 h-6 w-6" />
          Previsualización de Imágenes
        </CardTitle>
        <CardDescription className="text-xs">
          Este panel muestra imágenes detectadas automáticamente en el archivo JSON. 
          La detección incluye campos con nombres comunes (ej: image, url, path), rutas URL directas y Data URIs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
              <p>Analizando JSON en busca de imágenes...</p>
            </div>
          ) : !jsonSelected ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <SearchSlash className="h-12 w-12 mb-2" />
                <p>Seleccione un archivo JSON para ver las imágenes.</p>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <ImageCard key={`${img.jsonPath}-${index}`} image={img} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <SearchSlash className="h-12 w-12 mb-2" />
              <p>No se encontraron imágenes en el archivo seleccionado.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ImagePreviewPanel;
