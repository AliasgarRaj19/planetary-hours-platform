export type BlogMarkdownBlock =
  | {
      id: string;
      text: string;
      type: 'heading';
    }
  | {
      id: string;
      text: string;
      type: 'paragraph';
    }
  | {
      id: string;
      items: string[];
      type: 'list';
    };

export function parseBlogMarkdown(markdown: string): BlogMarkdownBlock[] {
  const blocks: BlogMarkdownBlock[] = [];
  const paragraph: string[] = [];
  const listItems: string[] = [];
  let index = 0;

  function nextId(type: BlogMarkdownBlock['type']) {
    index += 1;
    return `${type}-${index}`;
  }

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({
        id: nextId('paragraph'),
        text: cleanMarkdownText(paragraph.join(' ')),
        type: 'paragraph',
      });
      paragraph.length = 0;
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({
        id: nextId('list'),
        items: listItems.map(cleanMarkdownText),
        type: 'list',
      });
      listItems.length = 0;
    }
  }

  for (const rawLine of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^#{1,3}\s+(.+)$/.exec(line);

    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        id: nextId('heading'),
        text: cleanMarkdownText(headingMatch[1]),
        type: 'heading',
      });
      continue;
    }

    const listMatch = /^[-*]\s+(.+)$/.exec(line);

    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function cleanMarkdownText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\(https:\/\/[^)\s]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]*>/g, '')
    .trim();
}
