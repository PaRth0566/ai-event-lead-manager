import { describe, it, expect } from 'bun:test';
import { parseMarkdown, markdownToPlainText, stripInlineMarkdown } from '../lib/markdown';

describe('Markdown Parser (AI response rendering)', () => {
  const geminiStyleSummary = `* **Attendee Context/Role:** Sarah Jenkins, Founder at Pulse Dynamics (building an AI-assisted healthcare workflow engine).
* **Core Pain Points/Challenges:** Needs to replace their current transcription API to achieve lower latency and ensure HIPAA-compliant data residency.
* **Expressed Interest/Topics Discussed:** Pricing tiers for high-volume usage exceeding 100k requests per month.`;

  it('parses Gemini-style bullet summaries into list items', () => {
    const blocks = parseMarkdown(geminiStyleSummary);
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('ul');
    if (blocks[0].type === 'ul') {
      expect(blocks[0].items.length).toBe(3);
      expect(blocks[0].items[0].text.startsWith('**Attendee Context/Role:**')).toBe(true);
    }
  });

  it('converts AI summaries to clean plain text without markdown symbols', () => {
    const plain = markdownToPlainText(geminiStyleSummary);
    expect(plain).not.toContain('**');
    expect(plain).not.toContain('* ');
    expect(plain).toContain('• Attendee Context/Role: Sarah Jenkins, Founder at Pulse Dynamics');
    expect(plain).toContain('• Core Pain Points/Challenges: Needs to replace');
  });

  it('parses headings, bold text, paragraphs, and numbered lists', () => {
    const md = `## Meeting Recap

This is **important** and *notable* text.

1. First step
2. Second step`;
    const blocks = parseMarkdown(md);
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'ol']);
    const plain = markdownToPlainText(md);
    expect(plain).toContain('Meeting Recap');
    expect(plain).toContain('This is important and notable text.');
    expect(plain).toContain('1. First step');
    expect(plain).toContain('2. Second step');
    expect(plain).not.toContain('**');
  });

  it('preserves line breaks inside email-style plain drafts', () => {
    const draft = `Subject: Great connecting at Tech Summit

Hi Rahul,

Looking forward to the walkthrough.

Best regards,
[Your Name]`;
    const plain = markdownToPlainText(draft);
    expect(plain).toContain('Subject: Great connecting at Tech Summit\n\nHi Rahul,');
    expect(plain).toContain('Best regards,\n[Your Name]');
  });

  it('renders fenced code and keeps HTML as inert text (no injection)', () => {
    const md = 'Before\n```html\n<script>alert("x")</script>\n```\n<img src=x onerror=alert(1)>';
    const blocks = parseMarkdown(md);
    expect(blocks.some((b) => b.type === 'code' && b.text.includes('<script>'))).toBe(true);
    // The <img> line is treated as plain paragraph text — the React renderer
    // displays it as text, never interprets it as HTML.
    const paragraph = blocks.find((b) => b.type === 'paragraph');
    expect(paragraph).toBeDefined();
  });

  it('strips inline markdown including links in plain text output', () => {
    expect(stripInlineMarkdown('**Bold** and *italic* and `code`')).toBe('Bold and italic and code');
    expect(stripInlineMarkdown('See [our site](https://example.com) for details')).toBe(
      'See our site for details'
    );
  });
});
