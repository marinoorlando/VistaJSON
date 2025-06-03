import type React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileListItemProps {
  fileName: string;
  isSelected: boolean;
  onSelect: () => void;
}

const FileListItem: React.FC<FileListItemProps> = ({ fileName, isSelected, onSelect }) => {
  return (
    <li
      className={cn(
        "flex items-center p-3 mb-2 rounded-md cursor-pointer transition-all duration-150 ease-in-out",
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
    </li>
  );
};

export default FileListItem;
