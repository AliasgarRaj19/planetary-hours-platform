import type { Href } from 'expo-router';

export const BLOG_TAB_NAME = 'blog';
export const BLOG_TAB_TITLE = 'Blog';

export function getBlogArticleHref(slug: string) {
  return {
    params: { slug },
    pathname: '/blog/[slug]',
  } as unknown as Href;
}
