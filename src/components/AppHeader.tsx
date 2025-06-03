import React from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';

interface AppHeaderProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onFileUpload }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-headline font-semibold">VistaJSON</h1>
      <div>
        <input
          type="file"
          multiple
          accept=".json"
          onChange={onFileUpload}
          ref={fileInputRef}
          className="hidden"
          id="json-file-upload"
        />
        <Button onClick={handleUploadClick} variant="secondary" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <UploadCloud className="mr-2 h-5 w-5" />
          Cargar Archivo(s) JSON
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
