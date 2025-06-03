
'use client';

import type React from 'react';
import { useState, useEffect, useCallback }
from 'react';
import AppHeader from '@/components/AppHeader';
import FileListPanel from '@/components/FileListPanel';
import JsonViewer from '@/components/JsonViewer';
import ImagePreviewPanel from '@/components/ImagePreviewPanel';
import type { UploadedFile, FoundImage } from '@/types';
import { findImagesInJson } from '@/lib/json-utils';
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
  const [showJsonContent, setShowJsonContent] = useState(true);
  const { toast } = useToast();

  const selectedFile = uploadedFiles.find(f => f.id === selectedFileId) || null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newUploadedFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        const parsedContent = JSON.parse(content);
        newUploadedFiles.push({
          id: `${file.name}-${Date.now()}`, // Simple unique ID
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
    event.target.value = ''; // Reset file input
  };

  const handleRemoveFile = (fileIdToRemove: string) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileIdToRemove));
    if (selectedFileId === fileIdToRemove) {
      setSelectedFileId(null);
      setParsedJsonData(null);
      setImageSuggestions([]);
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
      return;
    }

    setIsLoadingJson(true);
    setParsedJsonData(file.parsedContent);
    setIsLoadingJson(false);

    setIsLoadingSuggestions(true); // Covers AI + local finding
    try {
      let aiSuggestedFields: string[] = [];
      const MAX_RETRIES = 1; // Total 2 attempts: 1 initial + 1 retry
      let attempt = 0;

      // Attempt to get AI suggestions with retry logic
      while (attempt <= MAX_RETRIES) {
        try {
          const aiSuggestionsOutput = await suggestImageFields({ jsonContent: file.content });
          aiSuggestedFields = aiSuggestionsOutput.imageFields || [];
          break; // AI call succeeded
        } catch (error: any) {
          console.error(`Error en suggestImageFields (intento ${attempt + 1}/${MAX_RETRIES + 1}):`, error);
          const errorMessage = error.message ? String(error.message).toLowerCase() : "";
          const errorString = error.toString ? String(error.toString()).toLowerCase() : "";
          const isQuotaError = errorMessage.includes("429") || errorString.includes("429") || errorMessage.includes("quota") || errorString.includes("exceeded");

          if (isQuotaError && attempt < MAX_RETRIES) {
            attempt++; // This is now the current attempt number (1 for first retry, etc.)
            let delaySeconds = 30; // Default delay
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
            // Continue to next attempt in the while loop
          } else if (isQuotaError) { // Quota error, max retries reached or it was the last attempt
            toast({
              title: "Límite de Tasa Alcanzado",
              description: "Se excedió el límite de la IA. Se usará detección básica.",
              variant: "destructive",
            });
            aiSuggestedFields = []; // Ensure no AI fields are used
            break; // Exit AI suggestion attempts
          } else { // Non-quota AI error
            toast({
              title: "Error de IA",
              description: "Error al comunicarse con la IA. Se usará detección básica.",
              variant: "destructive",
            });
            aiSuggestedFields = []; // Ensure no AI fields are used
            break; // Exit AI suggestion attempts
          }
        }
      }

      // Now, find images using AI suggestions (if any) or basic logic
      try {
        const foundImages = findImagesInJson(file.parsedContent, aiSuggestedFields);
        setImageSuggestions(foundImages);
      } catch (findError) {
        console.error("Error al buscar imágenes en el JSON (después de intentos de IA):", findError);
        toast({
          title: "Error de Detección de Imágenes",
          description: "Ocurrió un error al procesar las imágenes. Se intentará detección básica.",
          variant: "destructive",
        });
        // Fallback to findImagesInJson without any AI-suggested fields
        const foundImages = findImagesInJson(file.parsedContent);
        setImageSuggestions(foundImages);
      }
    } catch (overallError) {
      // Catch-all for any unexpected errors during the entire suggestion process
      console.error("Error general en processFileContent:", overallError);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error inesperado al procesar el archivo.",
        variant: "destructive",
      });
      setImageSuggestions([]); // Clear suggestions on major failure
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
          // If the selected file was removed, and it's not in uploadedFiles anymore
          setSelectedFileId(null);
          setParsedJsonData(null);
          setImageSuggestions([]);
        }
    } else if (!selectedFileId) {
        setParsedJsonData(null);
        setImageSuggestions([]);
        setIsLoadingJson(false);
        setIsLoadingSuggestions(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFileId, processFileContent, uploadedFiles]); // Added uploadedFiles dependency

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
              <JsonViewer 
                data={parsedJsonData} 
                isLoading={isLoadingJson}
                showContent={showJsonContent}
                onToggleShowContent={handleToggleJsonContent}
              />
            </div>
            <div className="flex-1 min-h-[300px] md:min-h-0 md:h-1/2">
              <ImagePreviewPanel 
                images={imageSuggestions} 
                isLoading={isLoadingSuggestions} 
                jsonSelected={!!selectedFileId}
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

