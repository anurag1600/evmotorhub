import { ContentBlock, ContentBlockType } from './types';

function genId(): string {
  return 'blk_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Parse a single CSV/XLSX cell's raw text into structured ContentBlocks.
 *
 * Supported line-level syntax (one directive per line):
 *   # Heading 1
 *   ## Heading 2
 *   ### Heading 3
 *   #### Heading 4
 *   ##### Heading 5
 *   ###### Heading 6
 *   > Quote text            (optional | Author  on same line)
 *   ---                     (divider)
 *   [image: url | caption | alt]
 *   [youtube: url | title]
 *   [button: text | url | primary|secondary|dark]
 *   [html: <raw html>]
 *   [gallery: url1 | caption1 ; url2 | caption2]
 *   [product: title | price | image_url | description | link_url | badge]
 *   [cta: title | description | button_text | button_url | #colorhex]
 *
 * List blocks:
 *   - item 1
 *   - item 2
 *   (blank line ends the list)
 *
 *   1. first
 *   2. second
 *   (blank line ends the list)
 *
 * Table blocks:
 *   | Header1 | Header2 |
 *   | ------- | ------- |
 *   | cell1   | cell2   |
 *
 * Everything else is collected into paragraph blocks (consecutive non-blank,
 * non-directive lines form one paragraph, separated by blank lines).
 *
 * Inline formatting within text fields (paragraph, heading, blockquote, list items, table cells):
 *   **bold**, *italic*, __bold__, _italic_, [link text](url), `code`
 *   These are preserved as-is in the text; the renderer interprets them.
 */

interface ParseContext {
  blocks: ContentBlock[];
  paragraphLines: string[];
  listType: 'unordered' | 'ordered' | null;
  listItems: string[];
  tableLines: string[];
}

function flushParagraph(ctx: ParseContext) {
  if (ctx.paragraphLines.length > 0) {
    ctx.blocks.push({
      id: genId(),
      type: 'paragraph',
      data: { text: ctx.paragraphLines.join('\n') },
    });
    ctx.paragraphLines = [];
  }
}

function flushList(ctx: ParseContext) {
  if (ctx.listType && ctx.listItems.length > 0) {
    ctx.blocks.push({
      id: genId(),
      type: ctx.listType === 'ordered' ? 'ordered_list' : 'unordered_list',
      data: { items: ctx.listItems },
    });
  }
  ctx.listType = null;
  ctx.listItems = [];
}

function flushTable(ctx: ParseContext) {
  if (ctx.tableLines.length < 2) {
    // Not enough lines for a table (need header + separator + at least implied structure)
    // Treat as paragraphs instead
    ctx.tableLines.forEach(line => ctx.paragraphLines.push(line));
    ctx.tableLines = [];
    return;
  }

  const parseRow = (line: string): string[] => {
    const trimmed = line.trim();
    // Remove leading/trailing pipes
    const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '');
    return inner.split('|').map(c => c.trim());
  };

  const isSeparatorRow = (line: string): boolean => {
    const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return inner.split('|').every(c => /^[-:\s]+$/.test(c.trim()));
  };

  const headers = parseRow(ctx.tableLines[0]);
  const rows = ctx.tableLines.slice(1).filter(l => !isSeparatorRow(l)).map(parseRow);
  ctx.blocks.push({
    id: genId(),
    type: 'table',
    data: { headers, rows },
  });
  ctx.tableLines = [];
}

function parseBracketDirective(line: string): ContentBlock | null {
  const match = line.match(/^\[(\w+):\s*(.*)\]\s*$/);
  if (!match) return null;

  const kind = match[1].toLowerCase();
  const body = match[2];

  switch (kind) {
    case 'image': {
      const parts = splitPipe(body);
      return {
        id: genId(),
        type: 'image',
        data: {
          url: (parts[0] || '').trim(),
          caption: (parts[1] || '').trim(),
          alt: (parts[2] || '').trim(),
        },
      };
    }
    case 'youtube': {
      const parts = splitPipe(body);
      return {
        id: genId(),
        type: 'youtube',
        data: {
          url: (parts[0] || '').trim(),
          title: (parts[1] || '').trim(),
        },
      };
    }
    case 'button': {
      const parts = splitPipe(body);
      return {
        id: genId(),
        type: 'button',
        data: {
          text: (parts[0] || '').trim(),
          url: (parts[1] || '').trim(),
          style: (parts[2] || 'primary').trim() as 'primary' | 'secondary' | 'dark',
        },
      };
    }
    case 'html': {
      return {
        id: genId(),
        type: 'html',
        data: { code: body.trim() },
      };
    }
    case 'gallery': {
      const entries = body.split(';').map(e => e.trim()).filter(Boolean);
      const images = entries.map(e => {
        const parts = splitPipe(e);
        return { url: (parts[0] || '').trim(), caption: (parts[1] || '').trim() };
      });
      return {
        id: genId(),
        type: 'image_gallery',
        data: { images },
      };
    }
    case 'product': {
      const parts = splitPipe(body);
      return {
        id: genId(),
        type: 'product_card',
        data: {
          title: (parts[0] || '').trim(),
          price: (parts[1] || '').trim(),
          image_url: (parts[2] || '').trim(),
          description: (parts[3] || '').trim(),
          link_url: (parts[4] || '').trim(),
          badge: (parts[5] || '').trim(),
        },
      };
    }
    case 'cta': {
      const parts = splitPipe(body);
      return {
        id: genId(),
        type: 'cta_banner',
        data: {
          title: (parts[0] || '').trim(),
          description: (parts[1] || '').trim(),
          button_text: (parts[2] || '').trim(),
          button_url: (parts[3] || '').trim(),
          background_color: (parts[4] || '#145a2c').trim(),
        },
      };
    }
    default:
      return null;
  }
}

function splitPipe(s: string): string[] {
  return s.split('|').map(p => p.trim());
}

export function parseContentToBlocks(raw: string): ContentBlock[] {
  const text = (raw || '').trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const ctx: ParseContext = {
    blocks: [],
    paragraphLines: [],
    listType: null,
    listItems: [],
    tableLines: [],
  };

  const flushAll = () => {
    flushTable(ctx);
    flushList(ctx);
    flushParagraph(ctx);
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line — flush everything
    if (!trimmed) {
      flushAll();
      continue;
    }

    // Table row detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(ctx);
      flushParagraph(ctx);
      ctx.tableLines.push(trimmed);
      continue;
    } else if (ctx.tableLines.length > 0) {
      // Non-table line after table rows — flush table
      flushTable(ctx);
    }

    // Heading detection
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList(ctx);
      flushParagraph(ctx);
      const level = headingMatch[1].length;
      const type = `heading${level}` as ContentBlockType;
      ctx.blocks.push({
        id: genId(),
        type,
        data: { text: headingMatch[2].trim() },
      });
      continue;
    }

    // Divider detection
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushList(ctx);
      flushParagraph(ctx);
      ctx.blocks.push({ id: genId(), type: 'divider', data: {} });
      continue;
    }

    // Blockquote detection
    if (trimmed.startsWith('> ')) {
      flushList(ctx);
      flushParagraph(ctx);
      const quoteBody = trimmed.slice(2);
      const pipeIdx = quoteBody.indexOf('|');
      if (pipeIdx > 0) {
        ctx.blocks.push({
          id: genId(),
          type: 'blockquote',
          data: {
            text: quoteBody.slice(0, pipeIdx).trim(),
            author: quoteBody.slice(pipeIdx + 1).trim(),
          },
        });
      } else {
        ctx.blocks.push({
          id: genId(),
          type: 'blockquote',
          data: { text: quoteBody.trim(), author: '' },
        });
      }
      continue;
    }

    // Ordered list detection
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph(ctx);
      if (ctx.listType !== 'ordered') {
        flushList(ctx);
        ctx.listType = 'ordered';
      }
      ctx.listItems.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Unordered list detection
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph(ctx);
      if (ctx.listType !== 'unordered') {
        flushList(ctx);
        ctx.listType = 'unordered';
      }
      ctx.listItems.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Bracket directives: [image: ...], [youtube: ...], etc.
    const directive = parseBracketDirective(trimmed);
    if (directive) {
      flushList(ctx);
      flushParagraph(ctx);
      ctx.blocks.push(directive);
      continue;
    }

    // Non-list line after a list — flush list
    if (ctx.listType) {
      flushList(ctx);
    }

    // Regular paragraph line
    ctx.paragraphLines.push(trimmed);
  }

  // Flush any remaining content
  flushAll();

  return ctx.blocks;
}

/**
 * Convert ContentBlocks back to a plain-text representation for the `content` column.
 * Includes text from paragraphs, headings, list items, blockquotes, and table cells.
 * Non-text blocks (images, youtube, dividers, etc.) contribute a brief placeholder
 * so the `content` field isn't empty and can be used for search/fallback.
 */
export function blocksToText(blocks: ContentBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    const d = block.data;
    switch (block.type) {
      case 'paragraph':
        if (d.text) parts.push(stripInline(d.text));
        break;
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'heading4':
      case 'heading5':
      case 'heading6':
        if (d.text) parts.push(stripInline(d.text));
        break;
      case 'unordered_list':
      case 'ordered_list':
        if (d.items) parts.push(d.items.map((i: string) => `• ${stripInline(i)}`).join('\n'));
        break;
      case 'blockquote':
        if (d.text) parts.push(stripInline(d.text));
        break;
      case 'table':
        if (d.headers) {
          parts.push([...d.headers, ...(d.rows || []).flat()].map(c => stripInline(String(c))).join('  '));
        }
        break;
      case 'image':
        if (d.caption) parts.push(d.caption);
        break;
      case 'youtube':
        if (d.title) parts.push(d.title);
        break;
      case 'product_card':
        if (d.title) parts.push(d.title);
        break;
      case 'cta_banner':
        if (d.title) parts.push(d.title);
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join('\n\n');
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
}

/**
 * Parse a JSON string of content blocks (for the content_blocks column in imports).
 * Returns null if parsing fails or the result isn't a valid array.
 */
export function parseContentBlocksJson(json: string): ContentBlock[] | null {
  if (!json || !json.trim()) return null;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    // Ensure each block has id and valid structure
    return parsed.map((b: any) => ({
      id: b.id || genId(),
      type: b.type as ContentBlockType,
      data: b.data || {},
    }));
  } catch {
    return null;
  }
}
