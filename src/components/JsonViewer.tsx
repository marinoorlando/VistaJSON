import type React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface JsonViewerProps {
  data: any;
  isLoading: boolean;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, isLoading }) => {
  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-primary">Contenido JSON</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Cargando contenido...</p>
            </div>
          ) : data ? (
            <pre className="text-sm bg-secondary/30 p-4 rounded-md overflow-auto font-code">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Seleccione un archivo para ver su contenido.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default JsonViewer;
