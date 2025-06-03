
'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo }
from 'react';
import AppHeader from '@/components/AppHeader';
import FileListPanel from '@/components/FileListPanel';
import JsonViewer from '@/components/JsonViewer';
import ImagePreviewPanel from '@/components/ImagePreviewPanel';
import type { UploadedFile, FoundImage } from '@/types';
import { findImagesInJson, getAllUniqueKeys, getParentObject, LITERAL_DATA_URI_KEYWORDS } from '@/lib/json-utils';
import { suggestImageFields } from '@/ai/flows/suggest-image-fields';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [parsedJsonData, setParsedJsonData] = useState<any>(null);
  const [imageSuggestions, setImageSuggestions] = useState<FoundImage[]>([]);
  const [isLoadingJson, setIsLoadingJson] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showJsonContent, setShowJsonContent] = useState(false);
  const { toast } = useToast();

  const [imagesToShow, setImagesToShow] = useState<number>(2);
  const [imageGridColumns, setImageGridColumns] = useState<number>(2);
  const [startingImageIndex, setStartingImageIndex] = useState<number>(0); // 0-based
  const [imageSearchTerm, setImageSearchTerm] = useState<string>('');

  const selectedFile = uploadedFiles.find(f => f.id === selectedFileId) || null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoadingJson(true);
    const newUploadedFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const parsedContent = JSON.parse(content);
        newUploadedFiles.push({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          content,
          parsedContent,
        });
      } catch (error) {
        console.error("Error al procesar el archivo:", file.name, error);
        toast({
          title: "Error de Archivo",
          description: `No se pudo cargar o parsear el archivo "${file.name}". Asegúrese de que es un JSON válido.`,
          variant: "destructive",
        });
      }
    }
    
    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
    if (newUploadedFiles.length > 0 && !selectedFileId) {
      setSelectedFileId(newUploadedFiles[0].id);
    }
    setIsLoadingJson(false);
    event.target.value = '';
  };

  const handleRemoveFile = (fileIdToRemove: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileIdToRemove));
    if (selectedFileId === fileIdToRemove) {
      setSelectedFileId(null);
      setParsedJsonData(null);
      setImageSuggestions([]);
      setStartingImageIndex(0);
      setImageSearchTerm('');
    }
    const removedFile = uploadedFiles.find(f => f.id === fileIdToRemove);
    toast({
      title: "Archivo Eliminado",
      description: `El archivo "${removedFile?.name || 'seleccionado'}" ha sido eliminado de la lista.`,
    });
  };

  const processFileContent = useCallback(async (file: UploadedFile | null) => {
    if (!file) {
      setParsedJsonData(null);
      setImageSuggestions([]);
      setStartingImageIndex(0);
      setImageSearchTerm('');
      return;
    }

    setIsLoadingJson(true);
    setParsedJsonData(file.parsedContent);
    setIsLoadingJson(false);
    setStartingImageIndex(0);
    setImageSearchTerm(''); 

    setIsLoadingSuggestions(true);
    try {
      const extractedKeys = getAllUniqueKeys(file.parsedContent);
      let aiSuggestedFields: string[] = [];
      const MAX_RETRIES = 1; 
      let attempt = 0;

      if (extractedKeys.length > 0) {
        while (attempt <= MAX_RETRIES) {
          try {
            const aiSuggestionsOutput = await suggestImageFields({ jsonKeys: extractedKeys });
            aiSuggestedFields = aiSuggestionsOutput.imageFields || [];
            break; 
          } catch (error: any) {
            console.error(`Error en suggestImageFields (intento ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
            const errorMessage = error.message ? String(error.message).toLowerCase() : "";
            const errorString = error.toString ? String(error.toString()).toLowerCase() : "";
            const isQuotaError = errorMessage.includes("429") || errorString.includes("429") || errorMessage.includes("quota") || errorString.includes("quota") || errorMessage.includes("rate limit") || errorString.includes("rate limit") ;
            
            if (isQuotaError && attempt < MAX_RETRIES) {
              attempt++; 
              let delaySeconds = 30; 
              const retryDelayMatch = errorString.match(/"retryDelay":"(\d+)s"/);
              if (retryDelayMatch && retryDelayMatch[1]) {
                const parsedDelay = parseInt(retryDelayMatch[1], 10);
                if (!isNaN(parsedDelay) && parsedDelay > 0) {
                  delaySeconds = parsedDelay;
                }
              }
              toast({
                title: "Límite de IA Temporal",
                description: `Se reintentará en ${delaySeconds} segundos. (Reintento ${attempt}/${MAX_RETRIES})`,
                variant: "default",
              });
              await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            } else if (isQuotaError) { 
              toast({
                title: "Límite de Tasa Alcanzado",
                description: "Se excedió el límite de la IA. Se usará detección básica.",
                variant: "destructive",
              });
              aiSuggestedFields = []; 
              break; 
            } else { 
              toast({
                title: "Error de IA",
                description: "Error al comunicarse con la IA. Se usará detección básica.",
                variant: "destructive",
              });
              aiSuggestedFields = [];
              break;
            }
          }
        }
      } else {
        aiSuggestedFields = [];
      }

      try {
        const foundImages = findImagesInJson(file.parsedContent, aiSuggestedFields);
        const augmentedImages = foundImages.map(img => {
          const parentObject = getParentObject(file.parsedContent, img.jsonPath);
          let searchableContext: string | null = null;
          
          if (parentObject && typeof parentObject === 'object') {
            const parts: string[] = [];
            for (const key in parentObject) {
              if (Object.prototype.hasOwnProperty.call(parentObject, key)) {
                parts.push(key); 
                const value = parentObject[key];
                const lowerKey = key.toLowerCase();

                if (!LITERAL_DATA_URI_KEYWORDS.includes(lowerKey)) {
                    if (typeof value === 'string') {
                        parts.push(value);
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        parts.push(String(value));
                    }
                }
              }
            }
            searchableContext = parts.join(' '); 
          } else if (parentObject) { 
             try {
                searchableContext = JSON.stringify(parentObject);
             } catch(e) {/* ignore */}
          }
          return { ...img, searchableParentContext: searchableContext };
        });
        setImageSuggestions(augmentedImages);

      } catch (findError) {
        console.error("Error al buscar imágenes en el JSON (después de intentos de IA):", findError);
        toast({
          title: "Error de Detección de Imágenes",
          description: "Ocurrió un error al procesar las imágenes. Se intentará detección básica.",
          variant: "destructive",
        });
        const foundImages = findImagesInJson(file.parsedContent); 
        setImageSuggestions(foundImages.map(img => ({...img, searchableParentContext: null })));
      }
    } catch (overallError) {
      console.error("Error general en processFileContent:", overallError);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error inesperado al procesar el archivo.",
        variant: "destructive",
      });
      setImageSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedFileId && uploadedFiles.length > 0) {
        const currentSelectedFile = uploadedFiles.find(f => f.id === selectedFileId);
        if (currentSelectedFile) {
             processFileContent(currentSelectedFile);
        } else {
          setSelectedFileId(null); 
          setParsedJsonData(null);
          setImageSuggestions([]);
          setStartingImageIndex(0);
          setImageSearchTerm('');
        }
    } else if (!selectedFileId) {
        setParsedJsonData(null);
        setImageSuggestions([]);
        setIsLoadingJson(false);
        setIsLoadingSuggestions(false);
        setStartingImageIndex(0);
        setImageSearchTerm('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileId, processFileContent]); 

  const filteredImageSuggestions = useMemo(() => {
    const trimmedSearchTerm = imageSearchTerm.trim();
    if (!trimmedSearchTerm) {
      return imageSuggestions;
    }
    const searchTermLower = trimmedSearchTerm.toLowerCase();
  
    return imageSuggestions.filter(image => {
      const pathMatch = image.jsonPath.toLowerCase().includes(searchTermLower);
      if (pathMatch) return true;
  
      if (image.type === 'url') {
        const valueMatch = image.value.toLowerCase().includes(searchTermLower);
        if (valueMatch) return true;
      }
      
      if (image.searchableParentContext) {
        if (image.searchableParentContext.toLowerCase().includes(searchTermLower)) {
          return true;
        }
      }
  
      return false; 
    });
  }, [imageSuggestions, imageSearchTerm]);

  useEffect(() => {
    setStartingImageIndex(0);
  }, [imageSearchTerm]);


  const handleToggleJsonContent = () => {
    setShowJsonContent(prev => !prev);
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <AppHeader onFileUpload={handleFileUpload} />
      <main className="flex flex-1 overflow-hidden">
        <FileListPanel
          files={uploadedFiles}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          onRemoveFile={handleRemoveFile}
        />
        <section className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
          {selectedFileId && (isLoadingJson || isLoadingSuggestions) && (
             <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mr-2 text-primary" />
              Procesando archivo...
            </div>
          )}
          {!(selectedFileId && (isLoadingJson || isLoadingSuggestions)) && (
          <>
            <div className="flex-1 min-h-[300px] md:min-h-0 md:h-1/2">
              <ImagePreviewPanel 
                images={filteredImageSuggestions} 
                parsedJsonData={parsedJsonData}
                isLoading={isLoadingSuggestions && !selectedFileId} 
                jsonSelected={!!selectedFileId}
                selectedFileName={selectedFile?.name || null}
                imagesToShow={imagesToShow}
                setImagesToShow={setImagesToShow}
                imageGridColumns={imageGridColumns}
                setImageGridColumns={setImageGridColumns}
                startingImageIndex={startingImageIndex}
                setStartingImageIndex={setStartingImageIndex}
                imageSearchTerm={imageSearchTerm}
                setImageSearchTerm={setImageSearchTerm}
              />
            </div>
            <div className="flex-1 min-h-[300px] md:min-h-0 md:h-1/2">
              <JsonViewer 
                data={parsedJsonData} 
                isLoading={isLoadingJson && !selectedFileId} 
                showContent={showJsonContent}
                onToggleShowContent={handleToggleJsonContent}
              />
            </div>
          </>
          )}
          {!selectedFileId && !isLoadingJson && !isLoadingSuggestions && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-lg">
              <p>Por favor, cargue y seleccione un archivo JSON para comenzar.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

