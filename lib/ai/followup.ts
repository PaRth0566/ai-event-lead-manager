import { generateAICompletion } from './provider';

interface FollowUpParams {
  name: string;
  company: string;
  event: string;
  notes: string;
}

export interface FollowUpResult {
  draft: string;
  provider: string;
  isFallback: boolean;
}

const FOLLOWUP_SYSTEM_PROMPT = `You are an AI sales assistant drafting a 1-to-1 follow-up message after meeting someone at a business conference or event.

STRICT GUIDELINES:
1. Write a concise, courteous, and professional email message.
2. Mention the event naturally in the opening.
3. Reference ONLY the actual interaction points and discussion topics from the notes.
4. DO NOT invent pricing, discounts, commitments, or unmentioned features.
5. Avoid generic marketing jargon and pushy sales tactics.
6. Propose a natural next step directly related to what was discussed (or invite them to connect if no next step was specified).
7. Format the output cleanly with a Subject line, Salutation, Body, and Closing sign-off.
8. Return ONLY the drafted message text (no meta commentary).`;

/**
 * Intelligent deterministic local message drafter
 * Constructs a polite, contextual follow-up message from notes without external APIs
 */
function localSynthesizeFollowUp({ name, company, event, notes }: FollowUpParams): string {
  const firstName = name.trim().split(' ')[0] || name.trim();
  const cleanNotes = notes.trim();

  // Extract key topic or next step
  const sentences = cleanNotes
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let keyTopic = 'our discussion';
  if (sentences.length > 1) {
    keyTopic = sentences[1].replace(/^(they|he|she|we)\s+/i, '').replace(/\.$/, '');
  }

  // Check for next steps or demo requests in notes
  const lower = cleanNotes.toLowerCase();
  let actionCall = `Would you be open to a brief follow-up call this week to explore this further?`;
  if (lower.includes('demo next week') || lower.includes('product walkthrough')) {
    actionCall = `As discussed, I would love to schedule the product walkthrough we spoke about. Please let me know what day and time works best for your schedule.`;
  } else if (lower.includes('deck') || lower.includes('slide')) {
    actionCall = `Please find the relevant materials we discussed, and let me know if you would like to connect once you have had a chance to review.`;
  } else if (lower.includes('pilot') || lower.includes('architect')) {
    actionCall = `I would be glad to coordinate a technical session with your engineering team whenever you are ready.`;
  }

  return `Subject: Great connecting at ${event} / Following up

Hi ${firstName},

It was a pleasure meeting you at ${event}. I really enjoyed our conversation regarding ${company} and ${keyTopic}.

${actionCall}

Looking forward to continuing the conversation!

Best regards,
[Your Name]
[Your Title]`;
}

/**
 * Draft a professional follow-up message based on lead notes
 */
export async function draftFollowUp(params: FollowUpParams): Promise<FollowUpResult> {
  const { name, company, event, notes } = params;

  if (!notes || notes.trim().length === 0) {
    throw new Error('Interaction notes are required to draft a follow-up message');
  }

  const userPrompt = `Lead Name: ${name}
Company: ${company}
Event: ${event}

Interaction Notes:
"""
${notes.trim()}
"""

Draft a tailored, factual follow-up message according to the guidelines.`;

  const aiResult = await generateAICompletion({
    systemPrompt: FOLLOWUP_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.3,
  });

  if (aiResult.text && !aiResult.isFallback) {
    return {
      draft: aiResult.text,
      provider: aiResult.provider,
      isFallback: false,
    };
  }

  const localDraft = localSynthesizeFollowUp(params);
  return {
    draft: localDraft,
    provider: 'local_nlp_engine',
    isFallback: true,
  };
}
