
import type React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  isLoading: boolean;
  showContent: boolean;
  onToggleShowContent: () => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, isLoading, showContent, onToggleShowContent }) => {
  return (
    <Card className="flex-1 flex flex-col min-h-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-primary">Contenido JSON</CardTitle>
          <div className="flex items-center space-x-2">
            {showContent ? <Eye className="h-5 w-5 text-muted-foreground" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
            <Switch
              id="show-json-switch"
              checked={showContent}
              onCheckedChange={onToggleShowContent}
              aria-label={showContent ? "Ocultar contenido JSON" : "Mostrar contenido JSON"}
            />
            <Label htmlFor="show-json-switch" className="cursor-pointer text-sm">
              {showContent ? 'Visible' : 'Oculto'}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {showContent ? (
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
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-muted-foreground text-center">Contenido JSON oculto. Active el interruptor de arriba para mostrarlo.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JsonViewer;
