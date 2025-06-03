
import type React from 'react';
import type { FoundImage } from '@/types';
import ImageCard from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, SearchSlash } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImagePreviewPanelProps {
  images: FoundImage[];
  isLoading: boolean;
  jsonSelected: boolean;
  imagesToShow: number;
  setImagesToShow: (count: number) => void;
  imageGridColumns: number;
  setImageGridColumns: (cols: number) => void;
}

const getGridColsClass = (cols: number): string => {
  switch (cols) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-2";
    case 3: return "grid-cols-3";
    case 4: return "grid-cols-4";
    case 5: return "grid-cols-5";
    case 6: return "grid-cols-6";
    default: return "grid-cols-3"; // Default a 3 si el número no está en la lista
  }
};

const ImagePreviewPanel: React.FC<ImagePreviewPanelProps> = ({ 
  images, 
  isLoading, 
  jsonSelected,
  imagesToShow,
  setImagesToShow,
  imageGridColumns,
  setImageGridColumns
}) => {
  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center">
          <ImageIcon className="mr-2 h-6 w-6" />
          Previsualización de Imágenes
        </CardTitle>
        <CardDescription className="text-xs">
          Este panel muestra imágenes detectadas automáticamente en el archivo JSON. 
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 pt-2 border-t border-border items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="images-to-show" className="text-sm shrink-0">Mostrar:</Label>
            <Input
              id="images-to-show"
              type="number"
              min="1"
              value={imagesToShow}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  setImagesToShow(val);
                } else if (e.target.value === "") {
                  setImagesToShow(1); // O un default si se borra
                }
              }}
              className="w-20 h-9 text-sm"
              placeholder="Cant."
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="grid-columns" className="text-sm shrink-0">Columnas:</Label>
            <Select
              value={imageGridColumns.toString()}
              onValueChange={(value) => setImageGridColumns(parseInt(value, 10))}
            >
              <SelectTrigger id="grid-columns" className="w-20 h-9 text-sm">
                <SelectValue placeholder="Cols" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map(col => (
                  <SelectItem key={col} value={col.toString()}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4 min-h-0">
        <ScrollArea className="h-full">
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
            <div className={`grid ${getGridColsClass(imageGridColumns)} gap-4`}>
              {images.slice(0, imagesToShow).map((img, index) => (
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
