import { trackEvent } from './googleAnalytics';

export type AppDistributionMode = 'direct_apk' | 'google_play' | 'fallback';
export type DownloadLinkLocation = 'header' | 'footer';
export type ScheduleDateChangeDirection = 'previous' | 'today' | 'next';

export function trackAppDownloadClick(input: {
  distributionMode: AppDistributionMode;
  linkLocation: DownloadLinkLocation;
}) {
  trackEvent('app_download_click', {
    distribution_mode: input.distributionMode,
    link_location: input.linkLocation,
  });
}

export function trackScheduleDateChange(input: {
  direction: ScheduleDateChangeDirection;
  selectedDate: string;
}) {
  trackEvent('schedule_date_change', {
    direction: input.direction,
    selected_date: input.selectedDate,
  });
}

export function trackBlogArticleView(input: { articleSlug: string; articleTitle: string }) {
  trackEvent('blog_article_view', {
    article_slug: input.articleSlug,
    article_title: input.articleTitle,
  });
}

export function trackBlogCategorySelect(input: {
  categorySlug: string;
  categoryName: string;
}) {
  trackEvent('blog_category_select', {
    category_slug: input.categorySlug,
    category_name: input.categoryName,
  });
}
