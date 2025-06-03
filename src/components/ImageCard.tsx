
import React, { useState, useEffect, useMemo } from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { FoundImage } from '@/types';
import { Link2, Info } from 'lucide-react';
import { getParentObject } from '@/lib/json-utils';
import { Input } from '@/components/ui/input';


interface ImageCardProps {
  image: FoundImage;
  parsedJsonData: any | null;
}

const DATA_URI_LIKE_KEYS_LOWERCASE = ['datauri', 'imagedatauri', 'base64', 'imagedata', 'photodatauri'];

function findKeyForOffset(jsonString: string, offset: number): string | null {
  let currentPos = offset;

  // Scan backwards to find the opening quote of the string value this offset is in.
  let valueOpenQuote = -1;
  for (let i = currentPos; i >= 0; i--) {
    if (jsonString[i] === '"') {
      let slashes = 0;
      for (let j = i - 1; j >= 0 && jsonString[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) { // Not an escaped quote
        // Check if this quote is preceded by a colon (it's an opening quote of a value)
        let k = i - 1;
        while (k >= 0 && (jsonString[k] === ' ' || jsonString[k] === '\n' || jsonString[k] === '\r' || jsonString[k] === '\t')) k--; // skip whitespace
        if (k >= 0 && jsonString[k] === ':') {
          valueOpenQuote = i;
          break;
        }
      }
    }
  }
  if (valueOpenQuote === -1) return null;

  // Scan backwards from valueOpenQuote to find the colon
  let colonPos = -1;
  for (let i = valueOpenQuote - 1; i >= 0; i--) {
    if (jsonString[i] === ':') {
      colonPos = i;
      break;
    }
  }
  if (colonPos === -1) return null;

  // Scan backwards from colonPos to find the key's closing quote
  let keyCloseQuote = -1;
  for (let i = colonPos - 1; i >= 0; i--) {
    if (jsonString[i] === '"') {
      let slashes = 0;
      for (let j = i - 1; j >= 0 && jsonString[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) {
        keyCloseQuote = i;
        break;
      }
    }
  }
  if (keyCloseQuote === -1) return null;

  // Scan backwards from keyCloseQuote to find the key's opening quote
  let keyOpenQuote = -1;
  for (let i = keyCloseQuote - 1; i >= 0; i--) {
    if (jsonString[i] === '"') {
      let slashes = 0;
      for (let j = i - 1; j >= 0 && jsonString[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) {
        keyOpenQuote = i;
        break;
      }
    }
  }
  if (keyOpenQuote === -1) return null;

  return jsonString.substring(keyOpenQuote + 1, keyCloseQuote);
}


const ImageCard: React.FC<ImageCardProps> = ({ image, parsedJsonData }) => {
  const [hasError, setHasError] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailObject, setDetailObject] = useState<any>(null);
  const [detailObjectPath, setDetailObjectPath] = useState<string>("");
  const [dialogSearchTerm, setDialogSearchTerm] = useState("");

  useEffect(() => {
    setHasError(false);
  }, [image.value]);

  useEffect(() => {
    if (!isDetailModalOpen) {
      setDialogSearchTerm("");
    }
  }, [isDetailModalOpen]);

  const handleViewDetails = () => {
    if (!parsedJsonData) return;
    setDialogSearchTerm("");

    const parentObj = getParentObject(parsedJsonData, image.jsonPath);
    if (parentObj) {
      setDetailObject(parentObj);

      const pathSegments = image.jsonPath.replace(/\[(\d+)\]/g, '.$1').split('.');
      let parentDisplayPath = "Objeto Raíz";
      if (pathSegments.length > 1) {
        pathSegments.pop();
        parentDisplayPath = pathSegments.join('.').replace(/\.(\d+)/g, '[$1]');
      }
      setDetailObjectPath(parentDisplayPath);
      setIsDetailModalOpen(true);
    } else {
      setDetailObject({ error: "No se pudo determinar el objeto contenedor." });
      setDetailObjectPath(image.jsonPath);
      setIsDetailModalOpen(true);
    }
  };

  const { highlightedJsonHtml, matchCount } = useMemo(() => {
    if (!detailObject) return { highlightedJsonHtml: "No hay datos para mostrar.", matchCount: 0 };

    const jsonString = JSON.stringify(detailObject, null, 2);
    const searchTerm = dialogSearchTerm.trim();

    if (!searchTerm) {
      return { highlightedJsonHtml: jsonString, matchCount: 0 };
    }

    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearchTerm, 'gi');
    
    let calculatedMatchCount = 0;
    
    const tempHighlightedHtml = jsonString.replace(searchRegex, (match, offset) => {
      const keyOfMatch = findKeyForOffset(jsonString, offset);
      if (keyOfMatch && DATA_URI_LIKE_KEYS_LOWERCASE.includes(keyOfMatch.toLowerCase())) {
        return match; // Don't highlight if it's in a data URI value
      }
      // We will count actual highlights later by iterating again or by counting marks.
      // For now, just return the mark for replacement.
      return `<mark class="bg-accent text-accent-foreground px-0.5 py-0 rounded">${match}</mark>`;
    });

    // Recalculate count based on actual marks made
    // This is more accurate if the search term could itself contain characters that look like part of a mark tag
    // A simpler way is to count during the replace if we are sure the search term cannot create false positive marks
    let currentMatch;
    const globalSearchRegex = new RegExp(escapedSearchTerm, 'gi'); // Need a fresh regex for exec
    while ((currentMatch = globalSearchRegex.exec(jsonString)) !== null) {
        const keyOfMatch = findKeyForOffset(jsonString, currentMatch.index);
        if (!(keyOfMatch && DATA_URI_LIKE_KEYS_LOWERCASE.includes(keyOfMatch.toLowerCase()))) {
            calculatedMatchCount++;
        }
    }
    
    return { highlightedJsonHtml: tempHighlightedHtml, matchCount: calculatedMatchCount };
  }, [detailObject, dialogSearchTerm]);


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
  } else { // 'url' but not absolute, or some other unhandled case
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
            <DialogContent className="sm:max-w-[700px] w-[90vw]">
              <DialogHeader>
                <DialogTitle>Detalles del Objeto Contenedor</DialogTitle>
                <DialogDescription>
                  Mostrando el objeto JSON que contiene la imagen. Ruta del objeto: <code className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{detailObjectPath}</code>
                </DialogDescription>
              </DialogHeader>
              <div className="my-2 flex flex-col sm:flex-row sm:items-center gap-2">
                <Input
                  type="search"
                  placeholder="Buscar en detalles (no en Data URIs)..."
                  value={dialogSearchTerm}
                  onChange={(e) => setDialogSearchTerm(e.target.value)}
                  className="h-9 text-sm"
                />
                {dialogSearchTerm.trim() && (
                  <p className="text-xs text-muted-foreground shrink-0">
                    {matchCount} {matchCount === 1 ? 'coincidencia' : 'coincidencias'}
                  </p>
                )}
              </div>
              <div className="max-h-[55vh] mt-2 border rounded-md overflow-auto">
                <pre className="text-sm bg-card p-3 font-code">
                  <code dangerouslySetInnerHTML={{ __html: highlightedJsonHtml }} />
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ImageCard;

