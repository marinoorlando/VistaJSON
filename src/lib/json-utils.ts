
import type { FoundImage } from '@/types';

// Keywords that strongly suggest the field's value *is* the image data (likely base64 or a full Data URI)
const LITERAL_DATA_URI_KEYWORDS = ["datauri", "base64", "imagedata", "embeddedimage", "inlineimage"];
// Keywords that suggest the field's value is a path or URL to an image
const GENERIC_IMAGE_URL_KEYWORDS = ["image", "url", "path", "uri", "foto", "img", "icon", "avatar", "thumbnail", "picture"];

// Regex to match standard Data URIs for images, permissive for MIME types
const DATA_URI_REGEX = /data:image\/[a-zA-Z0-9.+*-]+;base64,([A-Za-z0-9+/=]+)/gi;


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
        let potentialImageUrl = value; // Original value
        const lowerKey = key.toLowerCase();

        // 1. Check for well-formed Data URIs using regex
        DATA_URI_REGEX.lastIndex = 0; // Reset regex state for global flag
        const dataUriMatch = DATA_URI_REGEX.exec(potentialImageUrl);
        if (dataUriMatch && dataUriMatch[0]) {
          imageType = 'dataUri';
          potentialImageUrl = dataUriMatch[0].trim(); // Ensure matched Data URI is also trimmed
        }
        // 2. Else, check for absolute URLs
        else if (potentialImageUrl.trim().startsWith('http://') || potentialImageUrl.trim().startsWith('https://')) {
          imageType = 'url';
          potentialImageUrl = potentialImageUrl.trim();
        }
        // 3. Else, if key name strongly suggests it's a Data URI (even if malformed or just base64)
        else if (LITERAL_DATA_URI_KEYWORDS.some(k => lowerKey.includes(k))) {
          imageType = 'dataUri'; 
          // potentialImageUrl remains as is, ImageCard will try to render it.
        }
        // 4. Else, if key name suggests a general image URL (could be relative)
        // This includes AI suggested fields that don't fall into the above categories.
        else if (suggestedFields.includes(key) || GENERIC_IMAGE_URL_KEYWORDS.some(k => lowerKey.includes(k))) {
             imageType = 'url';
             potentialImageUrl = potentialImageUrl.trim();
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

export function getParentObject(jsonData: any, imagePath: string): any | null {
  if (!jsonData || typeof jsonData !== 'object' || !imagePath) {
    return null;
  }

  // Normalize path: replace array[index] with array.index for easier splitting
  const normalizedPath = imagePath.replace(/\[(\d+)\]/g, '.$1');
  const pathSegments = normalizedPath.split('.');

  // If the path has only one segment (e.g., "imageUrl"), the parent is the root jsonData object.
  if (pathSegments.length <= 1) {
    return jsonData;
  }

  let currentObject = jsonData;
  // Iterate up to the second to last segment to get the direct parent object
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (currentObject && typeof currentObject === 'object' && segment in currentObject) {
      currentObject = currentObject[segment];
    } else {
      // Path is invalid or segment not found
      return null; 
    }
  }
  return currentObject;
}
