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
 * Produces a structured "**Label**: text" bullet summary from raw notes
 * without any external network calls. Bullets cover lead context, pain
 * points, expressed interest, and actionable next steps.
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
  } else if (
    sentences.length > 1 &&
    !painPoints.includes(sentences[1]) &&
    !nextSteps.includes(sentences[1])
  ) {
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
