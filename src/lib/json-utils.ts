
import type { FoundImage } from '@/types';

// Keywords that strongly suggest the field's value *is* the image data (likely base64 or a full Data URI)
const LITERAL_DATA_URI_KEYWORDS = ["datauri", "base64", "imagedata", "embeddedimage", "inlineimage"];
// Keywords that suggest the field's value is a path or URL to an image
const GENERIC_IMAGE_URL_KEYWORDS = ["image", "url", "path", "uri", "foto", "img", "icon", "avatar", "thumbnail", "picture"];

// Regex to match standard Data URIs for images, permissive for MIME types
const DATA_URI_REGEX = /data:image\/[a-zA-Z0-9.+*-]+;base64,([A-Za-z0-9+/]+={0,2})/gi;

// Helper function to extract all unique keys from a JSON object
export function getAllUniqueKeys(data: any): string[] {
  const keys = new Set<string>();
  function traverse(obj: any) {
    if (obj === null || typeof obj !== 'object') {
      return;
    }
    Object.keys(obj).forEach(key => {
      keys.add(key);
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        traverse(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any) => traverse(item));
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
        let potentialImageUrl = value.trim();
        const lowerKey = key.toLowerCase();

        // 1. Check for well-formed Data URIs using regex
        DATA_URI_REGEX.lastIndex = 0; // Reset regex state for global flag
        const dataUriMatch = DATA_URI_REGEX.exec(potentialImageUrl);
        if (dataUriMatch && dataUriMatch[0]) {
          imageType = 'dataUri';
          potentialImageUrl = dataUriMatch[0].trim(); // Ensure matched Data URI is also trimmed
        }
        // 2. Else, check for absolute URLs
        else if (potentialImageUrl.startsWith('http://') || potentialImageUrl.startsWith('https://')) {
          imageType = 'url';
        }
        // 3. Else, if key name strongly suggests it's a Data URI (even if malformed or just base64)
        else if (LITERAL_DATA_URI_KEYWORDS.some(k => lowerKey.includes(k))) {
          imageType = 'dataUri'; // Let ImageCard try and show its specific error if value is not a renderable Data URI
        }
        // 4. Else, if key name suggests a general image URL (could be relative)
        // This includes AI suggested fields that don't fall into the above categories.
        else if (suggestedFields.includes(key) || GENERIC_IMAGE_URL_KEYWORDS.some(k => lowerKey.includes(k))) {
             imageType = 'url';
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
