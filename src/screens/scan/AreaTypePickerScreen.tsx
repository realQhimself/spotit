import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<ScanStackParamList, 'AreaTypePicker'>;

interface AreaType {
  key: string;
  name: string;
  description: string;
  emoji: string;
}

const AREA_TYPES: AreaType[] = [
  { key: 'fridge', name: 'Fridge', description: 'Scan refrigerator shelves', emoji: '\u{1F9CA}' },
  { key: 'freezer', name: 'Freezer', description: 'Scan freezer contents', emoji: '\u{2744}\u{FE0F}' },
  { key: 'drawer', name: 'Drawer', description: 'Scan inside drawers', emoji: '\u{1F5C4}' },
  { key: 'cabinet', name: 'Cabinet', description: 'Scan cabinet shelves', emoji: '\u{1F6AA}' },
  { key: 'closet', name: 'Closet', description: 'Scan closet contents', emoji: '\u{1F45A}' },
  { key: 'bookshelf', name: 'Bookshelf', description: 'Scan books and items', emoji: '\u{1F4DA}' },
  { key: 'desk', name: 'Desk', description: 'Scan desk surface', emoji: '\u{1F5A5}' },
  { key: 'custom', name: 'Custom', description: 'Define your own area', emoji: '\u{2699}\u{FE0F}' },
];

export default function AreaTypePickerScreen({ navigation }: Props) {
  const handleSelect = (areaType: AreaType) => {
    navigation.navigate('LayerSetup', { areaType: areaType.key });
  };

  const renderItem = ({ item }: { item: AreaType }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.cardEmojiContainer}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.heading}>What area are you scanning?</Text>
        <Text style={styles.subheading}>
          Choose the type of area to set up scanning layers
        </Text>
      </View>

      <FlatList
        data={AREA_TYPES}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardEmojiContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
