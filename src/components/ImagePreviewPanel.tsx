
import type React from 'react';
import type { FoundImage } from '@/types';
import ImageCard from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, SearchSlash, SearchX } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface ImagePreviewPanelProps {
  images: FoundImage[];
  parsedJsonData: any | null;
  isLoading: boolean;
  jsonSelected: boolean;
  imagesToShow: number;
  setImagesToShow: (count: number) => void;
  imageGridColumns: number;
  setImageGridColumns: (cols: number) => void;
  startingImageIndex: number; 
  setStartingImageIndex: (index: number) => void; 
  imageSearchTerm: string;
  setImageSearchTerm: (term: string) => void;
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
  parsedJsonData,
  isLoading, 
  jsonSelected,
  imagesToShow,
  setImagesToShow,
  imageGridColumns,
  setImageGridColumns,
  startingImageIndex,
  setStartingImageIndex,
  imageSearchTerm,
  setImageSearchTerm
}) => {

  const handleStartingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1; 
    }
    if (images.length > 0 && val > images.length) {
      val = images.length;
    } else if (images.length === 0 && val > 1) {
      val = 1;
    }
    setStartingImageIndex(val - 1); 
  };

  const displayedImages = images.slice(startingImageIndex, startingImageIndex + imagesToShow);

  let noImagesMessage = 'No se encontraron imágenes en el archivo seleccionado.';
  if (jsonSelected && images.length === 0 && imageSearchTerm && imageSearchTerm.trim() !== "") {
    noImagesMessage = 'No se encontraron imágenes que coincidan con su búsqueda.';
  } else if (jsonSelected && images.length > 0 && displayedImages.length === 0) {
     noImagesMessage = 'Ajuste "Empezar desde Img Nº" o "Mostrar Cant." para ver las imágenes filtradas.';
  }


  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center">
          <ImageIcon className="mr-2 h-6 w-6" />
          Previsualización de Imágenes
        </CardTitle>
        <CardDescription className="text-xs">
          {jsonSelected 
            ? `Mostrando ${displayedImages.length} de ${images.length} imágenes ${imageSearchTerm ? 'filtradas' : 'totales'}.`
            : "Seleccione un archivo para ver las imágenes."}
        </CardDescription>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2 pt-2 border-t border-border items-end">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="image-search-term" className="text-sm">Buscar en datos de imagen:</Label>
            <div className="flex">
              <Input
                id="image-search-term"
                type="search"
                placeholder="Ej: paisaje, user.name..."
                value={imageSearchTerm}
                onChange={(e) => setImageSearchTerm(e.target.value)}
                className="h-9 text-sm rounded-r-none"
                disabled={!jsonSelected}
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 rounded-l-none border-l-0" 
                onClick={() => setImageSearchTerm('')}
                disabled={!imageSearchTerm}
                title="Limpiar búsqueda"
              >
                <SearchX className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <Label htmlFor="starting-image-index" className="text-sm">Empezar desde Img Nº:</Label>
            <Input
              id="starting-image-index"
              type="number"
              min="1"
              max={images.length > 0 ? images.length : 1}
              value={images.length === 0 ? (startingImageIndex === 0 ? 0 : 1) : startingImageIndex + 1}
              onChange={handleStartingImageChange}
              className="w-full h-9 text-sm"
              disabled={images.length === 0 && !imageSearchTerm}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Label htmlFor="images-to-show" className="text-sm">Mostrar Cant.:</Label>
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
              className="w-full h-9 text-sm"
              disabled={images.length === 0 && !imageSearchTerm}
            />
          </div>
          <div className="flex flex-col space-y-1 sm:col-span-2 lg:col-span-1"> {/* Adjust span for layout */}
            <Label htmlFor="grid-columns" className="text-sm">Columnas:</Label>
            <Select
              value={imageGridColumns.toString()}
              onValueChange={(value) => setImageGridColumns(parseInt(value, 10))}
              disabled={images.length === 0 && !imageSearchTerm}
            >
              <SelectTrigger id="grid-columns" className="w-full h-9 text-sm">
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
      <CardContent className="flex-1 overflow-hidden min-h-0 p-4"> 
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
                <ImageCard 
                  key={`${img.jsonPath}-${startingImageIndex + index}-${imageSearchTerm}`} 
                  image={img} 
                  parsedJsonData={parsedJsonData}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <SearchSlash className="h-12 w-12 mb-2" />
              <p>{noImagesMessage}</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ImagePreviewPanel;
