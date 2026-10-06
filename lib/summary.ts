/**
 * Deterministic, dependency-free note summarizer.
 * Pure string processing — safe to run on the server (AI fallback
 * in lib/ai/summarize.ts) and in the browser (lead list tooltips).
 */

export interface LocalSummaryParams {
  notes: string;
  name?: string;
  company?: string;
  event?: string;
}

const PAIN_POINT_KEYWORDS = [
  'struggle',
  'problem',
  'pain',
  'challenge',
  'issue',
  'lag',
  'too much time',
  'slow',
  'manual',
  'replace',
];

const INTEREST_KEYWORDS = [
  'interested',
  'looking for',
  'need',
  'wants',
  'express',
  'discussed',
  'showcase',
  'attracted',
  'explore',
];

const NEXT_STEP_KEYWORDS = [
  'demo',
  'call',
  'meeting',
  'walkthrough',
  'next week',
  'tuesday',
  'monday',
  'scheduled',
  'pilot',
  'deck',
  'rollout',
  'follow up',
  'loop in',
  'contract',
];

/**
 * Produces a summary in the SAME canonical template the AI prompts request:
 * "- **Label:** text" bullets with the labels Lead Context, Pain Points,
 * Expressed Interest, and Next Steps. Sections the notes don't mention are
 * omitted, so fallback and AI output share one consistent format.
 */
export function buildLocalSummary({ notes, name, company, event }: LocalSummaryParams): string {
  const cleanNotes = notes.trim();
  const sentences = cleanNotes
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const painPoints = sentences.filter((s) =>
    PAIN_POINT_KEYWORDS.some((k) => s.toLowerCase().includes(k))
  );
  const interests = sentences.filter(
    (s) =>
      INTEREST_KEYWORDS.some((k) => s.toLowerCase().includes(k)) && !painPoints.includes(s)
  );
  const nextSteps = sentences.filter((s) =>
    NEXT_STEP_KEYWORDS.some((k) => s.toLowerCase().includes(k))
  );

  const bullets: string[] = [];

  // Attendee & Event Context
  if (name && company) {
    bullets.push(`- **Lead Context:** Met ${name} from ${company}${event ? ` at ${event}` : ''}.`);
  } else if (sentences[0]) {
    bullets.push(`- **Lead Context:** ${sentences[0]}`);
  }

  // Pain Points
  if (painPoints.length > 0) {
    bullets.push(`- **Pain Points:** ${painPoints.join(' ')}`);
  }

  // Interest / Discussion
  if (interests.length > 0) {
    bullets.push(`- **Expressed Interest:** ${interests.join(' ')}`);
  } else if (
    sentences.length > 1 &&
    !painPoints.includes(sentences[1]) &&
    !nextSteps.includes(sentences[1])
  ) {
    bullets.push(`- **Expressed Interest:** ${sentences[1]}`);
  }

  // Next Steps
  if (nextSteps.length > 0) {
    bullets.push(`- **Next Steps:** ${nextSteps.join(' ')}`);
  }

  if (bullets.length === 0) {
    return cleanNotes;
  }

  return bullets.join('\n\n');
}
