import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getBlogArticles,
  getBlogCategories,
  type BlogArticle,
  type BlogCategory,
} from '@/src/api/blog';
import { getBlogArticleHref } from './blog-navigation';

export function BlogScreen() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadBlog = useCallback(
    async ({ refreshing = false }: { refreshing?: boolean } = {}) => {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      try {
        const [nextCategories, nextArticles] = await Promise.all([
          getBlogCategories(),
          getBlogArticles(selectedCategory || undefined),
        ]);

        setCategories(nextCategories);
        setArticles(nextArticles.items);
      } catch {
        setError('Blog content is unavailable right now.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedCategory],
  );

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            onRefresh={() => loadBlog({ refreshing: true })}
            refreshing={isRefreshing}
            tintColor="#f6c46f"
          />
        }>
        <View style={styles.header}>
          <Text style={styles.title}>Blog</Text>
          <Text style={styles.subtitle}>
            Read articles about planetary hours, planetary days, and traditional timing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {categories.length > 0 ? (
            <View style={styles.categoryList}>
              <CategoryChip
                isSelected={!selectedCategory}
                label="All"
                onPress={() => setSelectedCategory('')}
              />
              {categories.map((category) => (
                <CategoryChip
                  isSelected={selectedCategory === category.slug}
                  key={category.id}
                  label={category.name}
                  onPress={() => setSelectedCategory(category.slug)}
                />
              ))}
            </View>
          ) : isLoading ? (
            <Text style={styles.statusText}>Loading categories...</Text>
          ) : (
            <Text style={styles.statusText}>No published categories are available yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Articles</Text>
          {isLoading ? <Text style={styles.statusText}>Loading articles...</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!isLoading && !error && articles.length === 0 ? (
            <Text style={styles.statusText}>No published articles are available yet.</Text>
          ) : null}
          {articles.map((article) => (
            <Pressable
              accessibilityRole="button"
              key={article.id}
              onPress={() => router.push(getBlogArticleHref(article.slug))}
              style={styles.articleCard}>
              <Text style={styles.articleDate}>{formatPublishedDate(article.publishedAt)}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleExcerpt}>{article.excerpt}</Text>
              <Text style={styles.articleCategory}>
                {article.categories.map((category) => category.name).join(', ') || 'Blog'}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryChip({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}>
      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function formatPublishedDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
    : 'Published article';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  container: {
    gap: 20,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    gap: 8,
    paddingTop: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#c8d5e6',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 111, 0.36)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  categoryChipSelected: {
    backgroundColor: '#f6c46f',
  },
  categoryChipText: {
    color: '#f6c46f',
    fontSize: 13,
    fontWeight: '800',
  },
  categoryChipTextSelected: {
    color: '#101820',
  },
  articleCard: {
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  articleDate: {
    color: '#f6c46f',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  articleExcerpt: {
    color: '#c8d5e6',
    fontSize: 14,
    lineHeight: 20,
  },
  articleCategory: {
    color: '#dbe7f5',
    fontSize: 13,
    fontWeight: '700',
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
