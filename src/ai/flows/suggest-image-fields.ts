
'use server';

/**
 * @fileOverview A flow to suggest potential image fields in a JSON file by analyzing its keys.
 *
 * - suggestImageFields - A function that suggests potential image fields based on JSON keys.
 * - SuggestImageFieldsInput - The input type for the suggestImageFields function.
 * - SuggestImageFieldsOutput - The return type for the suggestImageFields function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImageFieldsInputSchema = z.object({
  jsonKeys: z
    .array(z.string())
    .describe('An array of unique key names extracted from the JSON structure.'),
});
export type SuggestImageFieldsInput = z.infer<typeof SuggestImageFieldsInputSchema>;

const SuggestImageFieldsOutputSchema = z.object({
  imageFields: z
    .array(z.string())
    .describe('An array of field names (from the input list) that are likely to contain image paths, URLs, or embedded image Data URIs.'),
});
export type SuggestImageFieldsOutput = z.infer<typeof SuggestImageFieldsOutputSchema>;

export async function suggestImageFields(input: SuggestImageFieldsInput): Promise<SuggestImageFieldsOutput> {
  return suggestImageFieldsFlow(input);
}

// This prompt definition is refined inside the flow for clarity in the original example,
// but we'll use a single, well-defined prompt here.
const refinedPrompt = ai.definePrompt({
    name: 'suggestImageFieldsPrompt', 
    input: {schema: z.object({ jsonStringifiedKeys: z.string() })}, // Schema matches what the template expects
    output: {schema: SuggestImageFieldsOutputSchema},
    prompt: `You are an expert at identifying fields that might contain image information by their names.
I have a JSON object and I've extracted all unique key names from it. Here is a JSON string array of these key names:
{{{jsonStringifiedKeys}}}

From this list, please identify and return an array of only those key names (from the provided list) that are most likely to contain:
- Image paths (e.g., "product.jpg", "/images/icon.png")
- Absolute image URLs (e.g., "https://example.com/image.gif")
- Embedded image data, often referred to as Data URIs (e.g., a field that might hold "data:image/png;base64,...")

Consider common naming conventions such as "image", "url", "path", "uri", "foto", "img", "icon", "avatar", "thumbnail", "picture", "base64Image", "imageData".
Ensure your output is a JSON array of strings. For example, if the input is '["user_avatar_image", "name", "photo_file_path", "embedded_image_data"]', your output might be '["user_avatar_image", "photo_file_path", "embedded_image_data"]'.
If no keys seem to be image-related, return an empty array.`,
});

const suggestImageFieldsFlow = ai.defineFlow(
  {
    name: 'suggestImageFieldsFlow',
    inputSchema: SuggestImageFieldsInputSchema,
    outputSchema: SuggestImageFieldsOutputSchema,
  },
  async (input: SuggestImageFieldsInput) => {
    // Pass the stringified JSON keys to the prompt, matching the refinedPrompt's input schema
    const {output} = await refinedPrompt({ jsonStringifiedKeys: JSON.stringify(input.jsonKeys) });
    return output!;
  }
);
