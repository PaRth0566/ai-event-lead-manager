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
Summarize the notes concisely and professionally for the sales team.

STRICT RULES:
1. Summarize ONLY the provided interaction notes. Never invent, assume, or extrapolate facts, metrics, or promises that are not in the text.
2. Keep the total summary under 120 words.
3. Write each bullet's text as one clear sentence.

OUTPUT FORMAT — follow EXACTLY the same way every time:
- Respond with ONLY a bullet list. Every bullet must use this shape: "- **Label:** text"
- Use EXACTLY these four labels, in this order, and include a bullet only when the notes actually mention that section:
  **Lead Context** — who the attendee is, their role, and where you met them.
  **Pain Points** — their core challenges or problems.
  **Expressed Interest** — what they asked about or responded to.
  **Next Steps** — concrete commitments, requests, or follow-ups.
- If a section is not present in the notes, omit that bullet entirely (do not write "Not mentioned").
- Do NOT use headings, numbered lists, tables, horizontal rules, nested bullets, or any other formatting.`;

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

Provide the summary now, following the OUTPUT FORMAT exactly.`;

  const aiResult = await generateAICompletion({
    systemPrompt: SUMMARIZE_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.1,
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
