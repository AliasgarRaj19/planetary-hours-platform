import { describe, expect, it } from 'vitest';
import { renderMarkdownToSafeHtml } from './markdown';

describe('safe Markdown rendering', () => {
  it('renders semantic headings, paragraphs, lists, and emphasis', () => {
    const html = renderMarkdownToSafeHtml(`# Title

Intro with **strong** and *emphasis*.

- One
- Two`);

    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<p>Intro with <strong>strong</strong> and <em>emphasis</em>.</p>');
    expect(html).toContain('<ul><li>One</li><li>Two</li></ul>');
  });

  it('escapes raw HTML instead of executing it', () => {
    const html = renderMarkdownToSafeHtml(`<script>alert("x")</script>

<img src=x onerror=alert(1)>`);

    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=');
  });

  it('only turns https links into anchors', () => {
    const html = renderMarkdownToSafeHtml(`Links:

- [Safe](https://example.com/path)
- [Http](http://example.com)
- [Script](javascript:alert(1))
- [Data](data:text/html,hello)
- [Vb](vbscript:msgbox(1))`);

    expect(html).toContain('<a href="https://example.com/path" rel="noopener noreferrer">Safe</a>');
    expect(html).not.toContain('href="http://example.com"');
    expect(html).not.toContain('href="javascript:alert(1)"');
    expect(html).not.toContain('href="data:text/html,hello"');
    expect(html).not.toContain('href="vbscript:msgbox(1)"');
  });

  it('keeps script, image, and event-handler HTML escaped', () => {
    const html = renderMarkdownToSafeHtml(`<a onclick="alert(1)">Click</a>

<img src="x" onerror="alert(1)">

<script src="https://example.com/script.js"></script>`);

    expect(html).toContain('&lt;a onclick=&quot;alert(1)&quot;&gt;Click&lt;/a&gt;');
    expect(html).toContain('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
    expect(html).toContain('&lt;script src=&quot;https://example.com/script.js&quot;&gt;&lt;/script&gt;');
    expect(html).not.toContain('<a onclick=');
    expect(html).not.toContain('<img src=');
    expect(html).not.toContain('<script src=');
  });
});
