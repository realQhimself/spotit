import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

interface Filter {
  label: string;
  value: string;
}

interface FilterChipsProps {
  filters: Filter[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

export default function FilterChips({
  filters,
  activeFilter,
  onFilterChange,
}: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = filter.value === activeFilter;
        return (
          <Pressable
            key={filter.value}
            onPress={() => onFilterChange(filter.value)}
            style={[
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isActive ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surfaceSecondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
});
