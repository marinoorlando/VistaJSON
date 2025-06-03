
import type { FoundImage } from '@/types';

// Keywords that strongly suggest the field's value *is* the image data (likely base64 or a full Data URI)
export const LITERAL_DATA_URI_KEYWORDS = [
  "datauri", 
  "base64", 
  "imagedata", 
  "embeddedimage", 
  "inlineimage", 
  "imagedatauri", 
  "photodatauri",
  "imagefile",
  "base64image",
  "filedata",
  "attachmentdata"
];
// Keywords that suggest the field's value is a path or URL to an image
const GENERIC_IMAGE_URL_KEYWORDS = ["image", "url", "path", "uri", "foto", "img", "icon", "avatar", "thumbnail", "picture"];

// Regex to match standard Data URIs for images, permissive for MIME types
const DATA_URI_REGEX = /data:image\/[a-zA-Z0-9.+*-]+;base64,([A-Za-z0-9+/=]+)/gi;

// Claves que, aunque relacionadas con archivos o metadatos, probablemente no son la imagen visualizable en sí.
const EXPLICITLY_SKIPPED_IMAGE_KEYS = [
  "originalfilename",
  "original_filename",
  "filename", 
  "artisticstyle",
  "aspectratio",
  "style", 
  "ratio",
  "imagequality",
  "suggestedprompt" 
];


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
      const lowerKey = key.toLowerCase();

      // Excluir explícitamente ciertas claves de la detección de imágenes
      if (EXPLICITLY_SKIPPED_IMAGE_KEYS.includes(lowerKey)) {
        // Si el valor es un objeto o array, aún recorrerlo por si contiene otros campos de imagen
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              traverse(item, `${newPath}[${index}]`);
            });
          } else {
            traverse(value, newPath);
          }
        }
        return; // Omitir este par clave-valor para la detección directa de imágenes
      }

      if (typeof value === 'string') {
        let imageType: FoundImage['type'] | null = null;
        let potentialImageUrl = value; 
        
        DATA_URI_REGEX.lastIndex = 0; 
        const dataUriMatch = DATA_URI_REGEX.exec(potentialImageUrl);
        
        if (dataUriMatch && dataUriMatch[0]) {
          imageType = 'dataUri';
          potentialImageUrl = dataUriMatch[0].trim();
        } else if (LITERAL_DATA_URI_KEYWORDS.some(k => lowerKey.includes(k))) {
          imageType = 'dataUri';
          potentialImageUrl = potentialImageUrl.trim(); // Asumir que es un Data URI incluso si no tiene el prefijo completo
        } else if (potentialImageUrl.trim().startsWith('http://') || potentialImageUrl.trim().startsWith('https://')) {
          imageType = 'url';
          potentialImageUrl = potentialImageUrl.trim();
        } else if (suggestedFields.includes(key) || GENERIC_IMAGE_URL_KEYWORDS.some(k => lowerKey.includes(k))) {
             imageType = 'url'; // Podría ser una ruta relativa o un nombre de archivo que la IA considera imagen
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

  const normalizedPath = imagePath.replace(/\[(\d+)\]/g, '.$1');
  const pathSegments = normalizedPath.split('.');

  if (pathSegments.length <= 1) {
    return jsonData; 
  }

  let currentObject = jsonData;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (currentObject && typeof currentObject === 'object' && segment in currentObject) {
      currentObject = currentObject[segment];
    } else {
      return null; 
    }
  }
  return currentObject;
}

export function findKeyForOffset(jsonString: string, offset: number): string | null {
  let valueOpenQuote = -1;
  for (let i = offset; i >= 0; i--) {
    if (jsonString[i] === '"') {
      let slashes = 0;
      for (let j = i - 1; j >= 0 && jsonString[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) { 
        let k = i - 1;
        while (k >= 0 && (jsonString[k] === ' ' || jsonString[k] === '\n' || jsonString[k] === '\r' || jsonString[k] === '\t')) k--; 
        if (k >= 0 && jsonString[k] === ':') {
          valueOpenQuote = i;
          break;
        }
      }
    }
  }
  if (valueOpenQuote === -1) return null;

  let colonPos = -1;
  for (let i = valueOpenQuote - 1; i >= 0; i--) {
    if (jsonString[i] === ':') {
      colonPos = i;
      break;
    }
  }
  if (colonPos === -1) return null;

  let keyCloseQuote = -1;
  for (let i = colonPos - 1; i >= 0; i--) {
    if (jsonString[i] === '"') {
      let slashes = 0;
      for (let j = i - 1; j >= 0 && jsonString[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) {
        keyCloseQuote = i;
        break;
      }
    }
  }
  if (keyCloseQuote === -1) return null;

  let keyOpenQuote = -1;
  for (let i = keyCloseQuote - 1; i >= 0; i--) {
    if (jsonString[i] === '"') {
      let slashes = 0;
      for (let j = i - 1; j >= 0 && jsonString[j] === '\\'; j--) slashes++;
      if (slashes % 2 === 0) {
        keyOpenQuote = i;
        break;
      }
    }
  }
  if (keyOpenQuote === -1) return null;

  return jsonString.substring(keyOpenQuote + 1, keyCloseQuote);
}

