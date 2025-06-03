export interface UploadedFile {
  id: string;
  name: string;
  content: string; // Raw JSON string content
  parsedContent: any; // Parsed JSON object
}

export interface FoundImage {
  jsonPath: string; // e.g., "user.profile.avatarImage"
  value: string; // The URL or Data URI
  type: 'url' | 'dataUri';
}
