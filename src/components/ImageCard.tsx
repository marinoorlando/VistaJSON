import type React from 'react';
import NextImage from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { FoundImage } from '@/types';
import { Link2 } from 'lucide-react';

interface ImageCardProps {
  image: FoundImage;
}

const ImageCard: React.FC<ImageCardProps> = ({ image }) => {
  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium truncate font-code" title={image.jsonPath}>
          Ruta: {image.jsonPath}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 aspect-video relative bg-muted/20">
        {image.type === 'dataUri' ? (
          <img
            src={image.value}
            alt={`Imagen de ${image.jsonPath}`}
            className="object-contain w-full h-full"
            data-ai-hint="abstract illustration"
          />
        ) : (
          <NextImage
            src={image.value}
            alt={`Imagen de ${image.jsonPath}`}
            fill
            className="object-contain"
            data-ai-hint="digital art"
            onError={(e) => {
              // Fallback for broken image URLs
              const target = e.target as HTMLImageElement;
              target.srcset = 'https://placehold.co/300x200.png?text=Error';
              target.src = 'https://placehold.co/300x200.png?text=Error';
            }}
          />
        )}
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
