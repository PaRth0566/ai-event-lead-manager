import { generateAICompletion } from './provider';

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
 * Intelligent deterministic local synthesizer
 * Parses actual sentences and extracts key points without external network calls
 */
function localSynthesizeSummary({ notes, name, company, event }: SummarizeParams): string {
  const cleanNotes = notes.trim();
  const sentences = cleanNotes
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const painPointKeywords = ['struggle', 'problem', 'pain', 'challenge', 'issue', 'lag', 'too much time', 'slow', 'manual', 'replace'];
  const interestKeywords = ['interested', 'looking for', 'need', 'wants', 'express', 'discussed', 'showcase', 'attracted', 'explore'];
  const nextStepKeywords = ['demo', 'call', 'meeting', 'walkthrough', 'next week', 'tuesday', 'monday', 'scheduled', 'pilot', 'deck', 'rollout', 'follow up', 'loop in', 'contract'];

  const painPoints = sentences.filter((s) => painPointKeywords.some((k) => s.toLowerCase().includes(k)));
  const interests = sentences.filter((s) => interestKeywords.some((k) => s.toLowerCase().includes(k)) && !painPoints.includes(s));
  const nextSteps = sentences.filter((s) => nextStepKeywords.some((k) => s.toLowerCase().includes(k)));

  const bullets: string[] = [];

  // Attendee & Event Context
  if (name && company) {
    bullets.push(`**Lead Context**: Met ${name} from ${company}${event ? ` at ${event}` : ''}.`);
  } else if (sentences[0]) {
    bullets.push(`**Lead Context**: ${sentences[0]}`);
  }

  // Pain Points
  if (painPoints.length > 0) {
    bullets.push(`**Pain Point / Challenge**: ${painPoints.join(' ')}`);
  }

  // Interest / Discussion
  if (interests.length > 0) {
    bullets.push(`**Areas of Interest**: ${interests.join(' ')}`);
  } else if (sentences.length > 1 && !painPoints.includes(sentences[1]) && !nextSteps.includes(sentences[1])) {
    bullets.push(`**Discussion Highlights**: ${sentences[1]}`);
  }

  // Next Steps
  if (nextSteps.length > 0) {
    bullets.push(`**Actionable Next Steps**: ${nextSteps.join(' ')}`);
  }

  if (bullets.length === 0) {
    return cleanNotes;
  }

  return bullets.join('\n\n');
}

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

  // Use local contextual synthesis if no external provider was configured
  const localSummary = localSynthesizeSummary(params);
  return {
    summary: localSummary,
    provider: 'local_nlp_engine',
    isFallback: true,
  };
}
