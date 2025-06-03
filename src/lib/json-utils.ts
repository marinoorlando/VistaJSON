import type { FoundImage } from '@/types';

const IMAGE_KEYWORDS = ["image", "url", "path", "uri", "foto", "img"];

// Helper function to extract all unique keys from a JSON object
export function getAllUniqueKeys(data: any): string[] {
  const keys = new Set<string>();
  function traverse(obj: any) {
    if (obj === null || typeof obj !== 'object') {
      return;
    }
    Object.keys(obj).forEach(key => {
      keys.add(key);
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) { // Traverse objects, not array elements directly for keys
        traverse(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => traverse(item)); // Traverse items in arrays
      }
    });
  }
  traverse(data);
  return Array.from(keys);
}

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
          const lowerKey = key.toLowerCase();
          // Check if it's a field suggested by AI (which are just key names)
          // or matches general keywords.
          if (suggestedFields.includes(key) || IMAGE_KEYWORDS.some(k => lowerKey.includes(k))) {
             imageType = 'url'; // Assume it's a relative or resolvable URL
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
