
import type React from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { FoundImage } from '@/types';
import { Link2 } from 'lucide-react';

interface ImageCardProps {
  image: FoundImage;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  const isAbsoluteUrl = image.type === 'url' && (image.value.startsWith('http://') || image.value.startsWith('https://'));
  const isDataUri = image.type === 'dataUri';

  let imageContent;

  if (isDataUri) {
    imageContent = (
      <img
        src={image.value}
        alt={`Imagen de ${image.jsonPath}`}
        className="object-contain w-full h-full"
        data-ai-hint="abstract illustration"
      />
    );
  } else if (isAbsoluteUrl) {
    imageContent = (
      <NextImage
        src={image.value}
        alt={`Imagen de ${image.jsonPath}`}
        fill
        className="object-contain"
        data-ai-hint="digital art"
        onError={(e) => {
          // Fallback for broken image URLs
          const target = e.target as HTMLImageElement;
          target.srcset = 'https://placehold.co/300x200.png?text=Error+Al+Cargar';
          target.src = 'https://placehold.co/300x200.png?text=Error+Al+Cargar';
        }}
      />
    );
  } else {
    // For 'url' types that are not absolute (e.g., relative paths, malformed)
    imageContent = (
      <img
        src="https://placehold.co/300x200.png?text=Ruta+Inválida"
        alt={`Ruta inválida para ${image.jsonPath}`}
        className="object-contain w-full h-full"
        data-ai-hint="broken link"
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
        <CardDescription className="text-xs truncate flex items-center" title={image.value}>
          <Link2 className="h-3 w-3 mr-1 shrink-0" />
          {image.value}
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default ImageCard;
