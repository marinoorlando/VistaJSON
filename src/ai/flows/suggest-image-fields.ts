'use server';

/**
 * @fileOverview A flow to suggest potential image fields in a JSON file.
 *
 * - suggestImageFields - A function that suggests potential image fields in a JSON file.
 * - SuggestImageFieldsInput - The input type for the suggestImageFields function.
 * - SuggestImageFieldsOutput - The return type for the suggestImageFields function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImageFieldsInputSchema = z.object({
  jsonContent: z
    .string()
    .describe('The content of the JSON file as a string.'),
});
export type SuggestImageFieldsInput = z.infer<typeof SuggestImageFieldsInputSchema>;

const SuggestImageFieldsOutputSchema = z.object({
  imageFields: z
    .array(z.string())
    .describe('An array of field names that are likely to contain image paths or URLs.'),
});
export type SuggestImageFieldsOutput = z.infer<typeof SuggestImageFieldsOutputSchema>;

export async function suggestImageFields(input: SuggestImageFieldsInput): Promise<SuggestImageFieldsOutput> {
  return suggestImageFieldsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestImageFieldsPrompt',
  input: {schema: SuggestImageFieldsInputSchema},
  output: {schema: SuggestImageFieldsOutputSchema},
  prompt: `You are an expert at identifying image fields within JSON data.

  Given the following JSON content, analyze the field names and suggest which fields are most likely to contain image paths or URLs.
  Consider common naming conventions such as "image", "url", "path", "uri", "foto", and "img".
  Return only the array of field names.

  JSON content:
  {{jsonContent}}`,
});

const suggestImageFieldsFlow = ai.defineFlow(
  {
    name: 'suggestImageFieldsFlow',
    inputSchema: SuggestImageFieldsInputSchema,
    outputSchema: SuggestImageFieldsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
