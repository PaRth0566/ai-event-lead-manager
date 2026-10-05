import { describe, it, expect } from 'bun:test';
import { summarizeNotes } from '../lib/ai/summarize';
import { draftFollowUp } from '../lib/ai/followup';

describe('AI Summarization Service', () => {
  it('generates a concise structured summary from meeting notes', async () => {
    const notes =
      'Met Rahul at Tech Summit. He manages sales at Acme. They currently struggle with reporting. He was interested in our analytics product and asked for a demo next week.';

    const result = await summarizeNotes({
      notes,
      name: 'Rahul Sharma',
      company: 'Acme',
      event: 'Tech Summit 2026',
    });

    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(20);
    // Should mention context
    expect(result.summary.toLowerCase()).toContain('rahul');
    expect(result.summary.toLowerCase()).toContain('acme');
  });

  it('throws an error if notes are empty', async () => {
    expect(async () => {
      await summarizeNotes({ notes: '   ' });
    }).toThrow();
  });
});

describe('AI Follow-up Draft Service', () => {
  it('generates a personalized follow-up email draft', async () => {
    const notes =
      'Discussed automated reporting pipelines. Looking to replace current manual spreadsheets. Wants a 20-minute walkthrough on Tuesday.';

    const result = await draftFollowUp({
      name: 'Elena Rostova',
      company: 'Vanguard Cloud',
      event: 'SaaS Expo 2026',
      notes,
    });

    expect(result.draft).toBeDefined();
    expect(result.draft).toContain('Elena');
    expect(result.draft).toContain('SaaS Expo 2026');
    expect(result.draft).toContain('Subject:');
  });

  it('throws an error if notes are empty', async () => {
    expect(async () => {
      await draftFollowUp({
        name: 'John',
        company: 'Corp',
        event: 'Expo',
        notes: '',
      });
    }).toThrow();
  });
});
