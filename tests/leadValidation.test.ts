import { describe, it, expect } from 'bun:test';
import { leadSchema, aiSummarizeSchema, aiFollowUpSchema } from '../lib/validations/lead';

describe('Lead Schema Validation', () => {
  it('validates a complete and correct lead input', () => {
    const validLead = {
      name: 'Priya Sharma',
      company: 'Zenith Retail',
      email: 'priya@zenithretail.example.com',
      event: 'Retail Tech Summit 2026',
      notes: 'Interested in inventory alerts. Requested a demo next Wednesday.',
      follow_up_status: 'pending',
    };

    const result = leadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Priya Sharma');
      expect(result.data.follow_up_status).toBe('pending');
    }
  });

  it('rejects an empty or whitespace name', () => {
    const invalid = {
      name: '   ',
      company: 'Zenith',
      email: 'priya@example.com',
      event: 'Summit',
      notes: 'Some notes',
      follow_up_status: 'pending',
    };

    const result = leadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email formats', () => {
    const invalid = {
      name: 'John Doe',
      company: 'Acme',
      email: 'not-an-email',
      event: 'Summit',
      notes: 'Met at booth',
      follow_up_status: 'pending',
    };

    const result = leadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.flatten().fieldErrors.email;
      expect(emailError).toBeDefined();
    }
  });

  it('rejects an invalid follow_up_status', () => {
    const invalid = {
      name: 'John Doe',
      company: 'Acme',
      email: 'john@acme.com',
      event: 'Summit',
      notes: 'Met at booth',
      follow_up_status: 'unknown_status',
    };

    const result = leadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects notes exceeding 2500 characters', () => {
    const invalid = {
      name: 'John Doe',
      company: 'Acme',
      email: 'john@acme.com',
      event: 'Summit',
      notes: 'a'.repeat(2501),
      follow_up_status: 'pending',
    };

    const result = leadSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AI Payload Schemas', () => {
  it('validates AI summarize payload', () => {
    const valid = {
      notes: 'Discussed product pricing and pilot timeline.',
      name: 'Alex',
      company: 'TechCorp',
      event: 'AI Expo',
    };

    const result = aiSummarizeSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects AI summarize payload with too short notes', () => {
    const invalid = {
      notes: 'Hi',
    };

    const result = aiSummarizeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates AI follow-up payload', () => {
    const valid = {
      name: 'Sarah Connor',
      company: 'Cyberdyne',
      event: 'Robotics 2026',
      notes: 'Discussed migration away from legacy monitoring.',
    };

    const result = aiFollowUpSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('Lead Update Partial Schema Validation', () => {
  it('allows updating only status', () => {
    const update = { follow_up_status: 'contacted' as const };
    const result = leadSchema.partial().safeParse(update);
    expect(result.success).toBe(true);
  });

  it('allows updating only notes with trimmed whitespace', () => {
    const update = { notes: '  Followed up with executive slide deck.  ' };
    const result = leadSchema.partial().safeParse(update);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('Followed up with executive slide deck.');
    }
  });

  it('still validates email format when email is provided in update', () => {
    const invalidUpdate = { email: 'invalid-email-address' };
    const result = leadSchema.partial().safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});
