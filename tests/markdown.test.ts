import { describe, it, expect } from 'bun:test';
import { parseMarkdown, markdownToPlainText, stripInlineMarkdown } from '../lib/markdown';
import { buildLocalSummary } from '../lib/summary';

const CANONICAL_LABELS = ['Lead Context', 'Pain Points', 'Expressed Interest', 'Next Steps'];

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

describe('Summary format consistency (AI template vs local fallback)', () => {
  const notes =
    'Met Rahul at Tech Summit. He manages sales at Acme. They currently struggle with reporting. He was interested in our analytics product and asked for a demo next week.';

  it('local fallback emits the exact canonical "- **Label:** text" template', () => {
    const summary = buildLocalSummary({
      notes,
      name: 'Rahul Sharma',
      company: 'Acme',
      event: 'Tech Summit 2026',
    });
    const bullets = summary.split('\n\n');
    expect(bullets.length).toBeGreaterThan(1);
    for (const bullet of bullets) {
      const match = bullet.match(/^- \*\*(Lead Context|Pain Points|Expressed Interest|Next Steps):\*\* /);
      expect(match).not.toBeNull();
    }
    // Labels appear in the canonical order
    const labels = bullets.map((b) => b.match(/\*\*(.+?):\*\*/)?.[1]);
    expect(labels).toEqual([...labels].sort((a, b) => CANONICAL_LABELS.indexOf(a!) - CANONICAL_LABELS.indexOf(b!)));
  });

  it('parses the canonical template into the same structure as AI output', () => {
    const local = parseMarkdown(
      buildLocalSummary({ notes, name: 'Rahul Sharma', company: 'Acme', event: 'Tech Summit 2026' })
    );
    const ai = parseMarkdown(
      '- **Lead Context:** Met Rahul Sharma from Acme at Tech Summit 2026.\n\n- **Next Steps:** Asked for a demo next week.'
    );
    expect(local[0].type).toBe('ul');
    expect(ai[0].type).toBe('ul');
    if (local[0].type === 'ul' && ai[0].type === 'ul') {
      expect(local[0].items.length).toBeGreaterThan(1);
      expect(ai[0].items.length).toBe(2);
    }
    // Both convert to clean plain text with no markdown symbols
    const plain = markdownToPlainText(
      buildLocalSummary({ notes, name: 'Rahul Sharma', company: 'Acme', event: 'Tech Summit 2026' })
    );
    expect(plain).not.toContain('**');
    expect(plain).toContain('• Lead Context: Met Rahul Sharma from Acme');
  });
});
