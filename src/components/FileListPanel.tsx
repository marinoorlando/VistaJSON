
import type React from 'react';
import FileListItem from './FileListItem';
import type { UploadedFile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileListPanelProps {
  files: UploadedFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
}

const FileListPanel: React.FC<FileListPanelProps> = ({ files, selectedFileId, onSelectFile, onRemoveFile }) => {
  return (
    <aside className="w-full md:w-1/4 lg:w-1/5 p-4 border-r border-border bg-card flex flex-col">
      <h2 className="text-xl font-headline font-semibold mb-4 text-primary">Archivos Cargados</h2>
      {files.length === 0 ? (
        <p className="text-muted-foreground italic">No hay archivos cargados.</p>
      ) : (
        <ScrollArea className="flex-grow">
          <ul className="space-y-1">
            {files.map((file) => (
              <FileListItem
                key={file.id}
                fileId={file.id}
                fileName={file.name}
                isSelected={file.id === selectedFileId}
                onSelect={() => onSelectFile(file.id)}
                onRemoveFile={onRemoveFile}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </aside>
  );
};

export default FileListPanel;
