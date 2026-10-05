import { generateAICompletion } from './provider';
import { buildLocalSummary } from '@/lib/summary';

interface SummarizeParams {
  notes: string;
  name?: string;
  company?: string;
  event?: string;
}

export interface SummarizeResult {
  summary: string;
  provider: string;
  isFallback: boolean;
}

const SUMMARIZE_SYSTEM_PROMPT = `You are an AI sales assistant analyzing event interaction notes.
Your task is to summarize the notes concisely and professionally for the sales team.

STRICT GUIDELINES:
1. Summarize ONLY the provided interaction notes.
2. DO NOT invent, assume, or extrapolate facts, metrics, or promises not in the text.
3. Highlight:
   - Attendee context/role
   - Core pain points or challenges
   - Expressed interest or topics discussed
   - Concrete next steps / commitments (if specified)
4. Keep the summary under 120 words. Use clear, bulleted or structured formatting.
5. If certain information is missing (e.g., no next steps mentioned), simply omit it without fabricating.`;

/**
 * Summarize lead interaction notes
 */
export async function summarizeNotes(params: SummarizeParams): Promise<SummarizeResult> {
  const { notes, name, company, event } = params;

  if (!notes || notes.trim().length === 0) {
    throw new Error('Interaction notes cannot be empty');
  }

  const userPrompt = `Lead Name: ${name || 'N/A'}
Company: ${company || 'N/A'}
Event: ${event || 'N/A'}

Interaction Notes:
"""
${notes.trim()}
"""

Please provide a concise, factual summary following the required guidelines.`;

  const aiResult = await generateAICompletion({
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.2,
  });

  if (aiResult.text && !aiResult.isFallback) {
    return {
      summary: aiResult.text,
      provider: aiResult.provider,
      isFallback: false,
    };
  }

  // Use the shared deterministic synthesizer if no external provider was configured
  const localSummary = buildLocalSummary(params);
  return {
    summary: localSummary,
    provider: 'local_nlp_engine',
    isFallback: true,
  };
}
