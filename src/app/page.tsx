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

  const processFileContent = useCallback(async (file: UploadedFile | null) => {
    if (!file) {
      setParsedJsonData(null);
      setImageSuggestions([]);
      return;
    }

    setIsLoadingJson(true);
    setIsLoadingSuggestions(true);
    setParsedJsonData(file.parsedContent);
    setIsLoadingJson(false);

    try {
      // Call AI to suggest image fields
      const aiSuggestionsOutput = await suggestImageFields({ jsonContent: file.content });
      const aiSuggestedFields = aiSuggestionsOutput.imageFields || [];
      
      // Find images using parsed content and AI suggestions
      const foundImages = findImagesInJson(file.parsedContent, aiSuggestedFields);
      setImageSuggestions(foundImages);
    } catch (error) {
      console.error("Error al obtener sugerencias de imágenes o al buscarlas:", error);
      toast({
        title: "Error de Detección",
        description: "Ocurrió un error al intentar detectar imágenes en el JSON.",
        variant: "destructive",
      });
      // Fallback to finding images without AI suggestions if AI fails
      const foundImages = findImagesInJson(file.parsedContent);
      setImageSuggestions(foundImages);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [toast]);

  useEffect(() => {
    processFileContent(selectedFile);
  }, [selectedFileId, uploadedFiles, processFileContent, selectedFile]);


  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <AppHeader onFileUpload={handleFileUpload} />
      <main className="flex flex-1 overflow-hidden">
        <FileListPanel
          files={uploadedFiles}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
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
              <JsonViewer data={parsedJsonData} isLoading={isLoadingJson} />
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
