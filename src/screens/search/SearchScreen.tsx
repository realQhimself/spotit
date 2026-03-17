import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { SearchStackParamList } from '../../types/navigation';
import { searchItems } from '../../database/helpers/searchHelpers';
import type { SearchFilters } from '../../database/helpers/searchHelpers';
import type { SearchResult } from '../../types/detection';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

const FILTER_CHIPS = ['All', 'Food', 'Electronics', 'Keys', 'Clothing'];

const SUGGESTION_CHIPS = [
  'Where is my laptop?',
  'Where is my keys?',
  'Where is my passport?',
  'Where is my charger?',
];

const CATEGORY_COLORS: Record<string, string> = {
  Appliance: '#818CF8',
  Electronics: '#34D399',
  Keys: '#F59E0B',
  Sports: '#F87171',
  Food: '#60A5FA',
  Clothing: '#A78BFA',
};

const FALLBACK_COLORS = [
  '#818CF8', '#34D399', '#F59E0B', '#F87171', '#60A5FA', '#A78BFA', '#FB923C',
];

function getResultColor(category: string, index: number): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export default function SearchScreen() {
  const navigation = useNavigation<StackNavigationProp<SearchStackParamList>>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search
  const performSearch = useCallback(
    (searchQuery: string, filter: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const filters: SearchFilters = {};
          if (filter !== 'All') {
            filters.category = filter;
          }
          const searchResults = await searchItems(trimmed, filters);
          setResults(searchResults);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Trigger search when query or filter changes
  useEffect(() => {
    performSearch(query, activeFilter);
  }, [query, activeFilter, performSearch]);

  const showResults = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>{'\u{1F50D}'}</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for items..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} activeOpacity={0.7}>
              <Text style={styles.clearButton}>{'\u2715'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {FILTER_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[
              styles.filterChip,
              activeFilter === chip && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(chip)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === chip && styles.filterChipTextActive,
              ]}
            >
              {chip}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showResults ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.itemId}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const color = getResultColor(item.category, index);
            return (
              <TouchableOpacity
                style={styles.resultCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ItemDetail', { itemId: item.itemId })}
              >
                <View style={[styles.resultThumb, { backgroundColor: color + '25' }]}>
                  <Text style={[styles.resultThumbText, { color }]}>
                    {item.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultLocation}>
                    {item.roomName}{item.zoneName ? ` \u203A ${item.zoneName}` : ''}
                  </Text>
                </View>
                <Text style={styles.resultCategory}>{item.category}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            isSearching ? (
              <View style={styles.noResults}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsIcon}>{'\u{1F50D}'}</Text>
                <Text style={styles.noResultsText}>No items found</Text>
              </View>
            )
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Empty State */}
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\u{1F50D}'}</Text>
            <Text style={styles.emptyTitle}>Find Your Stuff</Text>
            <Text style={styles.emptyText}>
              Search for items by name, category, or description
            </Text>
          </View>

          {/* Suggestion Chips */}
          <Text style={styles.suggestionsLabel}>Where is my...?</Text>
          <View style={styles.suggestionsContainer}>
            {SUGGESTION_CHIPS.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => setQuery(suggestion.replace('Where is my ', '').replace('?', ''))}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionChipText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    fontSize: 16,
    color: colors.textSecondary,
    padding: spacing.xs,
  },
  filtersScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultsList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resultThumb: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  resultThumbText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  resultLocation: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultCategory: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  noResultsText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  emptyContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionsLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  suggestionChipText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
