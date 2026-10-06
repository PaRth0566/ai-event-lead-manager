import React from 'react';
import { parseMarkdown } from '@/lib/markdown';

/**
 * Renders constrained AI markdown as styled React text nodes.
 *
 * Security: all content flows through React's escaped text rendering —
 * raw HTML in AI output is displayed as text, never interpreted, and no
 * dangerouslySetInnerHTML is used anywhere. Links in AI output are
 * intentionally reduced to their label text.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const clean = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(clean.slice(lastIndex, match.index));
    }
    const token = match[0];
    key += 1;
    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(
        <strong key={`${keyPrefix}-b${key}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${key}`}
          className="font-mono text-[11px] bg-slate-100 border border-slate-200 rounded px-1 py-0.5"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(
        <em key={`${keyPrefix}-i${key}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < clean.length) {
    nodes.push(clean.slice(lastIndex));
  }
  return nodes;
}

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const blocks = parseMarkdown(text);

  return (
    <div className={`space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed break-words ${className}`}>
      {blocks.map((block, index) => {
        const key = `md-${index}`;
        switch (block.type) {
          case 'heading':
            return (
              <p key={key} className="text-xs sm:text-sm font-semibold text-slate-900">
                {renderInline(block.text, key)}
              </p>
            );
          case 'paragraph':
            return (
              <p key={key} className="whitespace-pre-line">
                {renderInline(block.lines.join('\n'), key)}
              </p>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc pl-4 space-y-1">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={`${key}-${itemIndex}`}
                    className={item.indent > 0 ? 'pl-4 list-[circle] marker:text-slate-400' : ''}
                  >
                    {renderInline(item.text, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="list-decimal pl-4 space-y-1">
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <pre
                key={key}
                className="bg-slate-50 border border-slate-200 rounded-md p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-slate-800"
              >
                {block.text}
              </pre>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
