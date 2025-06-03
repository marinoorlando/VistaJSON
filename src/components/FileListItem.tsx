
import type React from 'react';
import { FileText, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileListItemProps {
  fileId: string;
  fileName: string;
  isSelected: boolean;
  onSelect: () => void;
  onRemoveFile: (fileId: string) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ fileId, fileName, isSelected, onSelect, onRemoveFile }) => {
  const handleRemoveClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent onSelect from firing
    onRemoveFile(fileId);
  };
  
  return (
    <li
      className={cn(
        "flex items-center p-3 pr-2 mb-2 rounded-md cursor-pointer transition-all duration-150 ease-in-out group", // Added group for hover states on button
        "hover:bg-secondary/80",
        isSelected ? "bg-accent text-accent-foreground shadow-sm" : "bg-card hover:shadow-md"
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-selected={isSelected}
    >
      <FileText className="h-5 w-5 mr-3 shrink-0" />
      <span className="truncate flex-grow">{fileName}</span>
      {isSelected && <CheckCircle2 className="h-5 w-5 ml-2 text-primary-foreground shrink-0" />}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "ml-2 h-7 w-7 shrink-0 opacity-60 group-hover:opacity-100",
          isSelected ? "text-accent-foreground hover:bg-destructive/20 hover:text-destructive-foreground" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        )}
        onClick={handleRemoveClick}
        aria-label={`Quitar archivo ${fileName}`}
        title={`Quitar archivo ${fileName}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </li>
  );
};

export default FileListItem;
