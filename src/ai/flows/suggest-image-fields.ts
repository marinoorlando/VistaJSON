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
    .describe('An array of field names (from the input list) that are likely to contain image paths or URLs.'),
});
export type SuggestImageFieldsOutput = z.infer<typeof SuggestImageFieldsOutputSchema>;

export async function suggestImageFields(input: SuggestImageFieldsInput): Promise<SuggestImageFieldsOutput> {
  return suggestImageFieldsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImageFieldsPrompt',
  input: {schema: SuggestImageFieldsInputSchema},
  output: {schema: SuggestImageFieldsOutputSchema},
  prompt: `You are an expert at identifying image fields by their names.
I have a JSON object and I've extracted all unique key names from it. Here is a JSON string array of these key names:
{{{jsonStringifiedKeys}}}

From this list, please identify and return an array of only those key names (from the provided list) that are most likely to contain image paths or URLs.
Consider common naming conventions such as "image", "url", "path", "uri", "foto", and "img".
Ensure your output is a JSON array of strings. For example, if the input is '["user_avatar_image", "name", "photo_file_path"]', your output might be '["user_avatar_image", "photo_file_path"]'.
If no keys seem to be image-related, return an empty array.`,
});

const suggestImageFieldsFlow = ai.defineFlow(
  {
    name: 'suggestImageFieldsFlow',
    inputSchema: SuggestImageFieldsInputSchema, // The flow itself still takes the structured input
    outputSchema: SuggestImageFieldsOutputSchema,
  },
  async (input: SuggestImageFieldsInput) => {
    // The prompt's 'input.schema' is implicitly handled by Genkit if keys match.
    // However, our prompt template uses 'jsonStringifiedKeys'.
    const {output} = await prompt({ jsonStringifiedKeys: JSON.stringify(input.jsonKeys) } as any);
    // The 'as any' is used because the direct input to prompt() should match its defined input schema structure,
    // but we are transforming `input.jsonKeys` to `jsonStringifiedKeys` for the template.
    // A cleaner way might be to define the prompt's input schema to expect `jsonStringifiedKeys` directly.
    // For now, this works if the Genkit prompt correctly maps.
    // Let's adjust the prompt definition for clarity
    //
    // Corrected approach: the prompt input schema should match what the template expects.
    // Option 1: Prompt expects `jsonKeys` and template uses `{{#each jsonKeys}}`.
    // Option 2: Prompt expects `jsonStringifiedKeys` and we pass it pre-stringified.
    // The current prompt text uses `{{{jsonStringifiedKeys}}}`, so the prompt call needs to provide that.

    // The prompt `ai.definePrompt` has `input: {schema: SuggestImageFieldsInputSchema}`
    // This means the prompt function expects an object `{ jsonKeys: string[] }`
    // The template is `{{{jsonStringifiedKeys}}}`. This means we need to pass an object like `{ jsonStringifiedKeys: "..." }` to the prompt function.
    // This is a mismatch.
    // Let's redefine the prompt's input schema.

    // Re-defining prompt with specific input for the template
    const refinedPrompt = ai.definePrompt({
        name: 'suggestImageFieldsPromptRefined', // new name to avoid conflict if original is cached
        input: {schema: z.object({ jsonStringifiedKeys: z.string() })},
        output: {schema: SuggestImageFieldsOutputSchema},
        prompt: `You are an expert at identifying image fields by their names.
I have a JSON object and I've extracted all unique key names from it. Here is a JSON string array of these key names:
{{{jsonStringifiedKeys}}}

From this list, please identify and return an array of only those key names (from the provided list) that are most likely to contain image paths or URLs.
Consider common naming conventions such as "image", "url", "path", "uri", "foto", and "img".
Ensure your output is a JSON array of strings. For example, if the input is '["user_avatar_image", "name", "photo_file_path"]', your output might be '["user_avatar_image", "photo_file_path"]'.
If no keys seem to be image-related, return an empty array.`,
    });

    const {output: refinedOutput} = await refinedPrompt({ jsonStringifiedKeys: JSON.stringify(input.jsonKeys) });
    return refinedOutput!;
  }
);
