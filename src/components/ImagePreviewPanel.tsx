
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
  startingImageIndex: number; // 0-based
  setStartingImageIndex: (index: number) => void; // 0-based
}

const getGridColsClass = (cols: number): string => {
  switch (cols) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-2";
    case 3: return "grid-cols-3";
    case 4: return "grid-cols-4";
    case 5: return "grid-cols-5";
    case 6: return "grid-cols-6";
    default: return "grid-cols-3"; 
  }
};

const ImagePreviewPanel: React.FC<ImagePreviewPanelProps> = ({ 
  images, 
  isLoading, 
  jsonSelected,
  imagesToShow,
  setImagesToShow,
  imageGridColumns,
  setImageGridColumns,
  startingImageIndex,
  setStartingImageIndex
}) => {

  const handleStartingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1; // Min value is 1 for display
    }
    if (images.length > 0 && val > images.length) {
      val = images.length;
    } else if (images.length === 0 && val > 1) {
      val = 1;
    }
    setStartingImageIndex(val - 1); // Convert 1-based input to 0-based state
  };

  const displayedImages = images.slice(startingImageIndex, startingImageIndex + imagesToShow);

  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center">
          <ImageIcon className="mr-2 h-6 w-6" />
          Previsualización de Imágenes
        </CardTitle>
        <CardDescription className="text-xs">
          Este panel muestra imágenes detectadas automáticamente en el archivo JSON. 
          {images.length > 0 && ` Mostrando ${displayedImages.length} de ${images.length} imágenes totales.`}
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 pt-2 border-t border-border items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="starting-image-index" className="text-sm shrink-0">Empezar desde Img Nº:</Label>
            <Input
              id="starting-image-index"
              type="number"
              min="1"
              max={images.length > 0 ? images.length : 1}
              value={images.length === 0 ? 0 : startingImageIndex + 1} // Display 1-based
              onChange={handleStartingImageChange}
              className="w-24 h-9 text-sm"
              placeholder="Nº"
              disabled={images.length === 0}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="images-to-show" className="text-sm shrink-0">Mostrar Cant.:</Label>
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
                  setImagesToShow(1); 
                }
              }}
              className="w-20 h-9 text-sm"
              placeholder="Cant."
              disabled={images.length === 0}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="grid-columns" className="text-sm shrink-0">Columnas:</Label>
            <Select
              value={imageGridColumns.toString()}
              onValueChange={(value) => setImageGridColumns(parseInt(value, 10))}
              disabled={images.length === 0}
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
          ) : displayedImages.length > 0 ? (
            <div className={`grid ${getGridColsClass(imageGridColumns)} gap-4`}>
              {displayedImages.map((img, index) => (
                <ImageCard key={`${img.jsonPath}-${startingImageIndex + index}`} image={img} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <SearchSlash className="h-12 w-12 mb-2" />
              <p>{images.length > 0 && startingImageIndex >= images.length ? 'El índice inicial es demasiado alto.' : 'No se encontraron imágenes en el archivo seleccionado o para el rango especificado.'}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ImagePreviewPanel;

    