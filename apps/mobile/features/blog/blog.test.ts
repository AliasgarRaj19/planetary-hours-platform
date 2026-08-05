import { describe, expect, it } from 'vitest';
import { getBlogArticleHref, BLOG_TAB_NAME, BLOG_TAB_TITLE } from './blog-navigation';
import { parseBlogMarkdown } from './blog-markdown';

describe('mobile blog helpers', () => {
  it('defines the native Blog tab navigation target', () => {
    expect(BLOG_TAB_NAME).toBe('blog');
    expect(BLOG_TAB_TITLE).toBe('Blog');
    expect(getBlogArticleHref('what-are-planetary-hours')).toEqual({
      params: { slug: 'what-are-planetary-hours' },
      pathname: '/blog/[slug]',
    });
  });

  it('parses headings, paragraphs, lists, and emphasis into native text blocks', () => {
    const blocks = parseBlogMarkdown(`# Title

Intro with **strong** and *emphasis*.

- One
- Two`);

    expect(blocks).toEqual([
      { id: 'heading-1', text: 'Title', type: 'heading' },
      {
        id: 'paragraph-2',
        text: 'Intro with strong and emphasis.',
        type: 'paragraph',
      },
      { id: 'list-3', items: ['One', 'Two'], type: 'list' },
    ]);
  });

  it('keeps article rendering safe by stripping raw HTML tags from native text', () => {
    const blocks = parseBlogMarkdown(`<script>alert("x")</script>

<img src="x" onerror="alert(1)">

[Safe](https://example.com)`);

    expect(JSON.stringify(blocks)).not.toContain('<script');
    expect(JSON.stringify(blocks)).not.toContain('<img');
    expect(JSON.stringify(blocks)).not.toContain('onerror');
    expect(blocks.at(-1)).toMatchObject({ text: 'Safe' });
  });
});
