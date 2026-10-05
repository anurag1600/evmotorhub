import React from 'react';

/**
 * Parse inline formatting markers and return React nodes.
 *
 * Supported syntax (preserved as literal text in the content):
 *   **bold**  __bold__
 *   *italic*  _italic_
 *   `code`
 *   ==highlight==
 *   [link text](url)
 *
 * The parser processes left-to-right, finding the earliest match at each
 * position, so nesting is not supported (e.g. **bold *and italic*** won't
 * work — use them separately).
 */

type InlineToken =
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'highlight'; text: string }
  | { kind: 'link'; text: string; url: string }
  | { kind: 'text'; text: string };

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let pos = 0;
  const len = text.length;

  while (pos < len) {
    const remaining = text.slice(pos);

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(?:\*\*|__)(.+?)(?:\*\*|__)/);
    if (boldMatch) {
      tokens.push({ kind: 'bold', text: boldMatch[1] });
      pos += boldMatch[0].length;
      continue;
    }

    // Highlight: ==text==
    const hlMatch = remaining.match(/^==(.+?)==/);
    if (hlMatch) {
      tokens.push({ kind: 'highlight', text: hlMatch[1] });
      pos += hlMatch[0].length;
      continue;
    }

    // Code: `text`
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      tokens.push({ kind: 'code', text: codeMatch[1] });
      pos += codeMatch[0].length;
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({ kind: 'link', text: linkMatch[1], url: linkMatch[2] });
      pos += linkMatch[0].length;
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(?:\*|_)(.+?)(?:\*|_)/);
    if (italicMatch) {
      tokens.push({ kind: 'italic', text: italicMatch[1] });
      pos += italicMatch[0].length;
      continue;
    }

    // Plain text: consume up to the next special character
    const nextSpecial = remaining.search(/[*_`=\[]/);
    if (nextSpecial === -1) {
      tokens.push({ kind: 'text', text: remaining });
      pos = len;
    } else if (nextSpecial === 0) {
      // The special char didn't match any pattern above — consume it as text
      tokens.push({ kind: 'text', text: remaining[0] });
      pos += 1;
    } else {
      tokens.push({ kind: 'text', text: remaining.slice(0, nextSpecial) });
      pos += nextSpecial;
    }
  }

  return tokens;
}

export function renderInline(text: string): React.ReactNode {
  if (!text) return text;
  const tokens = tokenizeInline(text);
  return tokens.map((token, i) => {
    switch (token.kind) {
      case 'bold':
        return <strong key={i}>{token.text}</strong>;
      case 'italic':
        return <em key={i}>{token.text}</em>;
      case 'code':
        return <code key={i} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{token.text}</code>;
      case 'highlight':
        return <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">{token.text}</mark>;
      case 'link':
        return (
          <a key={i} href={token.url} target={token.url.startsWith('http') ? '_blank' : undefined} rel={token.url.startsWith('http') ? 'noopener noreferrer' : undefined} className="text-[#145a2c] font-medium hover:underline">
            {token.text}
          </a>
        );
      default:
        return token.text;
    }
  });
}
