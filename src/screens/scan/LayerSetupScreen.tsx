import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<ScanStackParamList, 'LayerSetup'>;

const SHELF_COLORS = [
  '#818CF8',
  '#34D399',
  '#F59E0B',
  '#F87171',
  '#60A5FA',
  '#A78BFA',
  '#FB923C',
  '#2DD4BF',
];

const AREA_LABELS: Record<string, string> = {
  fridge: 'Fridge',
  freezer: 'Freezer',
  drawer: 'Drawer',
  cabinet: 'Cabinet',
  closet: 'Closet',
  bookshelf: 'Bookshelf',
  desk: 'Desk',
  custom: 'Custom Area',
};

export default function LayerSetupScreen({ route, navigation }: Props) {
  const { areaType } = route.params;
  const [shelfCount, setShelfCount] = useState(3);

  const areaLabel = AREA_LABELS[areaType] || 'Area';

  const increment = () => {
    if (shelfCount < 8) setShelfCount(shelfCount + 1);
  };

  const decrement = () => {
    if (shelfCount > 1) setShelfCount(shelfCount - 1);
  };

  const shelves = Array.from({ length: shelfCount }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.areaType}>{areaLabel}</Text>
        <Text style={styles.heading}>How many shelves?</Text>
        <Text style={styles.subheading}>
          Set the number of layers or shelves to scan individually
        </Text>

        {/* Counter */}
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterButton, shelfCount <= 1 && styles.counterButtonDisabled]}
            onPress={decrement}
            activeOpacity={0.7}
            disabled={shelfCount <= 1}
          >
            <Text style={[styles.counterButtonText, shelfCount <= 1 && styles.counterButtonTextDisabled]}>
              -
            </Text>
          </TouchableOpacity>

          <View style={styles.counterDisplay}>
            <Text style={styles.counterNumber}>{shelfCount}</Text>
          </View>

          <TouchableOpacity
            style={[styles.counterButton, shelfCount >= 8 && styles.counterButtonDisabled]}
            onPress={increment}
            activeOpacity={0.7}
            disabled={shelfCount >= 8}
          >
            <Text style={[styles.counterButtonText, shelfCount >= 8 && styles.counterButtonTextDisabled]}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* Visual Diagram */}
        <View style={styles.diagramContainer}>
          <Text style={styles.diagramTitle}>Preview</Text>
          <View style={styles.diagram}>
            {shelves.map((num) => {
              const color = SHELF_COLORS[(num - 1) % SHELF_COLORS.length];
              return (
                <View
                  key={num}
                  style={[
                    styles.shelfBar,
                    { backgroundColor: color + '20', borderLeftColor: color },
                  ]}
                >
                  <View style={[styles.shelfNumberBadge, { backgroundColor: color }]}>
                    <Text style={styles.shelfNumberText}>{num}</Text>
                  </View>
                  <Text style={styles.shelfLabel}>Shelf {num}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Start Scanning Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CameraScan', { mode: 'area' })}
        >
          <Text style={styles.startButtonText}>Start Scanning</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  areaType: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
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
    marginBottom: spacing.xl,
  },
  // Counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  counterButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  counterButtonText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    lineHeight: 32,
  },
  counterButtonTextDisabled: {
    color: colors.textTertiary,
  },
  counterDisplay: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  counterNumber: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  // Diagram
  diagramContainer: {
    marginTop: spacing.sm,
  },
  diagramTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  diagram: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shelfBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  shelfNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  shelfNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  shelfLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
});
