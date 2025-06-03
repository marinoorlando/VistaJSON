import type { FoundImage } from '@/types';

const IMAGE_KEYWORDS = ["image", "url", "path", "uri", "foto", "img"];

export function findImagesInJson(jsonData: any, suggestedFields: string[] = []): FoundImage[] {
  const images: FoundImage[] = [];
  const uniqueImageValues = new Set<string>();

  function traverse(obj: any, currentPath: string) {
    if (obj === null || typeof obj !== 'object') {
      return;
    }

    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      if (typeof value === 'string') {
        let imageType: FoundImage['type'] | null = null;
        let potentialImageUrl = value;

        if (value.startsWith('data:image/')) {
          imageType = 'dataUri';
        } else if (value.startsWith('http://') || value.startsWith('https://')) {
          imageType = 'url';
        } else {
          // Check if it's a field suggested by AI or matches keywords, and could be a relative path or needs base URL
          const lowerKey = key.toLowerCase();
          if (suggestedFields.includes(key) || IMAGE_KEYWORDS.some(k => lowerKey.includes(k))) {
             // For now, we assume non-data URIs and non-absolute URLs from these fields are potential image URLs.
             // In a real app, we might need to prepend a base URL for relative paths.
             // We will treat them as 'url' for now, and let the browser try to resolve them.
             // If it's a local file system path, it won't render, which is a limitation.
             imageType = 'url';
          }
        }
        
        if (imageType && !uniqueImageValues.has(potentialImageUrl)) {
          images.push({ jsonPath: newPath, value: potentialImageUrl, type: imageType });
          uniqueImageValues.add(potentialImageUrl);
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          traverse(item, `${newPath}[${index}]`);
        });
      } else if (typeof value === 'object') {
        traverse(value, newPath);
      }
    });
  }
  traverse(jsonData, '');
  return images;
}
