import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { SearchStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<SearchStackParamList, 'Search'>;

const FILTER_CHIPS = ['All', 'Food', 'Electronics', 'Keys', 'Clothing'];

const SUGGESTION_CHIPS = [
  'Where is my laptop?',
  'Where is my keys?',
  'Where is my passport?',
  'Where is my charger?',
];

interface SearchResultItem {
  id: string;
  name: string;
  category: string;
  room: string;
  zone: string;
  lastSeen: string;
  color: string;
}

const MOCK_RESULTS: SearchResultItem[] = [
  { id: '1', name: 'Coffee Maker', category: 'Appliance', room: 'Kitchen', zone: 'Counter', lastSeen: '2 hours ago', color: '#818CF8' },
  { id: '2', name: 'Laptop', category: 'Electronics', room: 'Office', zone: 'Desk', lastSeen: 'Today', color: '#34D399' },
  { id: '3', name: 'Car Keys', category: 'Keys', room: 'Bedroom', zone: 'Nightstand', lastSeen: 'Yesterday', color: '#F59E0B' },
  { id: '4', name: 'Headphones', category: 'Electronics', room: 'Living Room', zone: 'Shelf', lastSeen: '3 days ago', color: '#F87171' },
  { id: '5', name: 'Yoga Mat', category: 'Sports', room: 'Bedroom', zone: 'Closet', lastSeen: '1 week ago', color: '#60A5FA' },
];

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredResults = query.length > 0
    ? MOCK_RESULTS.filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = activeFilter === 'All' || item.category === activeFilter;
        return matchesQuery && matchesFilter;
      })
    : [];

  const showResults = query.length > 0;

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
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.7}>
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
          data={filteredResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
            >
              <View style={[styles.resultThumb, { backgroundColor: item.color + '25' }]}>
                <Text style={[styles.resultThumbText, { color: item.color }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultLocation}>
                  {item.room} {'\u203A'} {item.zone}
                </Text>
              </View>
              <Text style={styles.resultLastSeen}>{item.lastSeen}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsIcon}>{'\u{1F50D}'}</Text>
              <Text style={styles.noResultsText}>No items found</Text>
            </View>
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
  resultLastSeen: {
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
