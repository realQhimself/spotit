import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<ScanStackParamList, 'ScanModePicker'>;

interface ScanMode {
  key: 'quick' | 'room' | 'area';
  title: string;
  description: string;
  icon: string;
  color: string;
}

const SCAN_MODES: ScanMode[] = [
  {
    key: 'quick',
    title: 'Quick Scan',
    description: 'Point camera at items to identify them',
    icon: '\u{26A1}',
    color: '#818CF8',
  },
  {
    key: 'room',
    title: 'Room Scan',
    description: 'Walk through a room to catalog everything',
    icon: '\u{1F3E0}',
    color: '#34D399',
  },
  {
    key: 'area',
    title: 'Area Scan',
    description: 'Scan inside a fridge, drawer, or cabinet',
    icon: '\u{1F4E6}',
    color: '#F59E0B',
  },
];

function ScanModeCard({
  mode,
  onPress,
  isPressed,
  onPressIn,
  onPressOut,
}: {
  mode: ScanMode;
  onPress: () => void;
  isPressed: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isPressed && styles.cardPressed,
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <View style={[styles.cardIconContainer, { backgroundColor: mode.color + '20' }]}>
        <Text style={styles.cardIcon}>{mode.icon}</Text>
      </View>
      <Text style={styles.cardTitle}>{mode.title}</Text>
      <Text style={styles.cardDescription}>{mode.description}</Text>
    </TouchableOpacity>
  );
}

export default function ScanModePickerScreen({ navigation }: Props) {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handlePress = (mode: ScanMode) => {
    if (mode.key === 'area') {
      navigation.navigate('AreaTypePicker');
    } else {
      navigation.navigate('CameraScan', { mode: mode.key });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>How do you want to scan?</Text>
        <Text style={styles.subheading}>
          Choose a scan mode that fits what you need
        </Text>

        {SCAN_MODES.map((mode) => (
          <ScanModeCard
            key={mode.key}
            mode={mode}
            onPress={() => handlePress(mode)}
            isPressed={pressedKey === mode.key}
            onPressIn={() => setPressedKey(mode.key)}
            onPressOut={() => setPressedKey(null)}
          />
        ))}
      </ScrollView>
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
    paddingTop: spacing.sm,
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
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
  },
  cardIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cardIcon: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
