import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBlogArticle, type BlogArticle } from '@/src/api/blog';
import { parseBlogMarkdown } from './blog-markdown';

export function BlogArticleScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const blocks = useMemo(
    () => (article ? parseBlogMarkdown(article.bodyMarkdown) : []),
    [article],
  );

  const loadArticle = useCallback(
    async ({ refreshing = false }: { refreshing?: boolean } = {}) => {
      if (!slug) {
        setArticle(null);
        setError('Article not found.');
        setIsLoading(false);
        return;
      }

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      try {
        setArticle(await getBlogArticle(slug));
      } catch {
        setArticle(null);
        setError('This article is not published or is no longer available.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadArticle({ refreshing: true })}
            refreshing={isRefreshing}
            tintColor="#f6c46f"
          />
        }>
        {isLoading ? <Text style={styles.statusText}>Loading article...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {article ? (
          <>
            <View style={styles.header}>
              <Text style={styles.date}>{formatPublishedDate(article.publishedAt)}</Text>
              <Text style={styles.title}>{article.title}</Text>
              <Text style={styles.excerpt}>{article.excerpt}</Text>
              <Text style={styles.category}>
                {article.categories.map((category) => category.name).join(', ') || 'Blog'}
              </Text>
            </View>

            <View style={styles.articleBody}>
              {blocks.map((block) => {
                if (block.type === 'heading') {
                  return (
                    <Text key={block.id} style={styles.bodyHeading}>
                      {block.text}
                    </Text>
                  );
                }

                if (block.type === 'list') {
                  return (
                    <View key={block.id} style={styles.list}>
                      {block.items.map((item, index) => (
                        <Text key={`${block.id}-${index}`} style={styles.bodyText}>
                          - {item}
                        </Text>
                      ))}
                    </View>
                  );
                }

                return (
                  <Text key={block.id} style={styles.bodyText}>
                    {block.text}
                  </Text>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatPublishedDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value))
    : 'Published article';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  container: {
    gap: 18,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    gap: 9,
  },
  date: {
    color: '#f6c46f',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  excerpt: {
    color: '#c8d5e6',
    fontSize: 15,
    lineHeight: 22,
  },
  category: {
    color: '#dbe7f5',
    fontSize: 13,
    fontWeight: '800',
  },
  articleBody: {
    gap: 13,
  },
  bodyHeading: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 4,
  },
  bodyText: {
    color: '#dbe7f5',
    fontSize: 15,
    lineHeight: 23,
  },
  list: {
    gap: 6,
  },
  statusText: {
    color: '#c8d5e6',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
});
