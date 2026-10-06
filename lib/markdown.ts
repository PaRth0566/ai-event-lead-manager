/**
 * Minimal Markdown utilities for AI-generated responses.
 *
 * Supports the constrained subset our AI prompts and fallback engine
 * actually produce: headings, bullet lists, numbered lists, paragraphs,
 * line breaks, bold, italic, inline code, and code fences. Anything
 * unrecognized degrades to plain paragraph text — raw Markdown symbols
 * are never shown to the user.
 *
 * Deliberately dependency-free: the parser feeds a React renderer
 * (components/ui/Markdown.tsx) that builds text nodes, so AI output can
 * never inject HTML into the page (no dangerouslySetInnerHTML anywhere).
 */

export interface MarkdownListItem {
  /** 0 for top level, 1 for one level of nesting */
  indent: number;
  text: string;
}

export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'ul'; items: MarkdownListItem[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; text: string };

/** Removes markdown links (keeps the label) — AI output must not inject URLs */
function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

/** Converts one inline markdown string to plain text (no **, *, ` symbols) */
export function stripInlineMarkdown(text: string): string {
  return stripLinks(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?])/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .trim();
}

/** Parses a markdown string into renderable blocks */
export function parseMarkdown(md: string): MarkdownBlock[] {
  const lines = (md ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', lines: paragraph });
      paragraph = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Fenced code block
    if (/^```/.test(trimmed)) {
      flushParagraph();
      const buffer: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buffer.push(lines[i]);
        i += 1;
      }
      i += 1; // skip closing fence (or EOF)
      blocks.push({ type: 'code', text: buffer.join('\n') });
      continue;
    }

    // Blank line ends the current paragraph
    if (!trimmed) {
      flushParagraph();
      i += 1;
      continue;
    }

    // Heading (# .. ######)
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      i += 1;
      continue;
    }

    // Horizontal rule — render as a section break (skip the symbol)
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      i += 1;
      continue;
    }

    // Lists (bullet or ordered), with one nesting level via 2-space indents
    const isOrdered = /^(\s*)\d+[.)]\s+/.test(line);
    const listMatch = line.match(isOrdered ? /^(\s*)\d+[.)]\s+(.*)$/ : /^(\s*)[-*•]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      const listRe = isOrdered ? /^(\s*)\d+[.)]\s+(.*)$/ : /^(\s*)[-*•]\s+(.*)$/;
      const items: MarkdownListItem[] = [];
      while (i < lines.length) {
        const m = lines[i].match(listRe);
        if (m) {
          items.push({ indent: m[1].length >= 2 ? 1 : 0, text: m[2].trim() });
          i += 1;
          continue;
        }
        // Continuation line: indented, non-empty, no new list marker
        const current = lines[i];
        if (current.trim() && /^\s{2,}/.test(current) && items.length > 0) {
          items[items.length - 1].text += ' ' + current.trim();
          i += 1;
          continue;
        }
        break;
      }
      blocks.push(
        isOrdered
          ? { type: 'ol', items: items.map((it) => it.text) }
          : { type: 'ul', items }
      );
      continue;
    }

    paragraph.push(line);
    i += 1;
  }

  flushParagraph();
  return blocks;
}

/**
 * Converts markdown to clean, readable plain text for the clipboard —
 * no **, #, or other markdown symbols, no HTML. Bold labels keep their
 * text, bullets become "•", numbered lists keep their numbers.
 */
export function markdownToPlainText(md: string): string {
  const blocks = parseMarkdown(md);
  const out: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        out.push(stripInlineMarkdown(block.text));
        break;
      case 'paragraph':
        out.push(block.lines.map(stripInlineMarkdown).join('\n'));
        break;
      case 'ul':
        for (const item of block.items) {
          out.push(`${item.indent > 0 ? '  ' : ''}• ${stripInlineMarkdown(item.text)}`);
        }
        break;
      case 'ol':
        block.items.forEach((item, index) => {
          out.push(`${index + 1}. ${stripInlineMarkdown(item)}`);
        });
        break;
      case 'code':
        out.push(block.text);
        break;
    }
  }

  return out.join('\n\n');
}
