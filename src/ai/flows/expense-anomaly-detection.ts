'use server';

/**
 * @fileOverview A flow for detecting anomalies in user's expense data and providing financial advice.
 *
 * - expenseAnomalyDetection - A function that takes user expense data and returns advice based on anomaly detection.
 * - ExpenseAnomalyDetectionInput - The input type for the expenseAnomalyDetection function.
 * - ExpenseAnomalyDetectionOutput - The return type for the expenseAnomalyDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpenseAnomalyDetectionInputSchema = z.object({
  expenseData: z.string().describe('A stringified JSON array of expense objects, each containing month and value (number).'),
  year: z.number().describe('The year for which the expense data is provided.'),
  userDescription: z.string().optional().describe('Optional description of the user, can include profession, income, and financial goals.'),
});
export type ExpenseAnomalyDetectionInput = z.infer<typeof ExpenseAnomalyDetectionInputSchema>;

const ExpenseAnomalyDetectionOutputSchema = z.object({
  advice: z.string().describe('Financial advice based on detected anomalies in the expense data.'),
});
export type ExpenseAnomalyDetectionOutput = z.infer<typeof ExpenseAnomalyDetectionOutputSchema>;

export async function expenseAnomalyDetection(input: ExpenseAnomalyDetectionInput): Promise<ExpenseAnomalyDetectionOutput> {
  return expenseAnomalyDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expenseAnomalyDetectionPrompt',
  input: {schema: ExpenseAnomalyDetectionInputSchema},
  output: {schema: ExpenseAnomalyDetectionOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the provided expense data for the year {{{year}}} and provide personalized advice to the user.

  Consider any anomalies or unusual spending patterns.

  Here's some additional information about the user:
  {{#if userDescription}}
  {{{userDescription}}}
  {{else}}
  The user has not provided any additional information.
  {{/if}}

  The expense data is provided as a JSON array:
  {{{expenseData}}}

  Based on this data, provide clear and actionable advice to help the user better manage their finances. Focus on anomaly detection and advice generation.
  Do not start with a greeting, and do not act as a chatbot.
  Be concise.
  `,
});

const expenseAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'expenseAnomalyDetectionFlow',
    inputSchema: ExpenseAnomalyDetectionInputSchema,
    outputSchema: ExpenseAnomalyDetectionOutputSchema,
  },
  async input => {
    try {
      // Parse the expense data string into a JSON object
      JSON.parse(input.expenseData);
    } catch (e) {
      throw new Error('Invalid expense data format: must be a valid JSON string.');
    }
    const {output} = await prompt(input);
    return output!;
  }
);
