import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { SettingsStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<SettingsStackParamList, 'Settings'>;

interface MenuRow {
  key: string;
  label: string;
  icon: string;
  type: 'navigate' | 'toggle' | 'action';
  danger?: boolean;
}

interface MenuSection {
  title: string;
  rows: MenuRow[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: 'Sync',
    rows: [
      { key: 'syncStatus', label: 'Sync Status', icon: '\u{1F504}', type: 'navigate' },
      { key: 'autoSync', label: 'Auto Sync', icon: '\u{2601}\u{FE0F}', type: 'toggle' },
    ],
  },
  {
    title: 'Data',
    rows: [
      { key: 'export', label: 'Export Data', icon: '\u{1F4E4}', type: 'action' },
      { key: 'clearCache', label: 'Clear Cache', icon: '\u{1F5D1}', type: 'action', danger: true },
    ],
  },
  {
    title: 'About',
    rows: [
      { key: 'version', label: 'Version 1.0.0', icon: '\u{2139}\u{FE0F}', type: 'action' },
      { key: 'privacy', label: 'Privacy Policy', icon: '\u{1F512}', type: 'navigate' },
      { key: 'terms', label: 'Terms of Service', icon: '\u{1F4C4}', type: 'navigate' },
    ],
  },
];

export default function SettingsScreen({ navigation }: Props) {
  const [autoSync, setAutoSync] = React.useState(true);

  const handleRowPress = (key: string) => {
    switch (key) {
      case 'syncStatus':
        navigation.navigate('SyncStatus');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>User Name</Text>
            <Text style={styles.profileEmail}>user@example.com</Text>
          </View>
          <TouchableOpacity
            style={styles.profileEditButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileEditText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, index) => (
                <TouchableOpacity
                  key={row.key}
                  style={[
                    styles.menuRow,
                    index < section.rows.length - 1 && styles.menuRowBorder,
                  ]}
                  activeOpacity={row.type === 'toggle' ? 1 : 0.7}
                  onPress={() => handleRowPress(row.key)}
                >
                  <Text style={styles.menuIcon}>{row.icon}</Text>
                  <Text style={[styles.menuLabel, row.danger && styles.menuLabelDanger]}>
                    {row.label}
                  </Text>
                  {row.type === 'toggle' ? (
                    <Switch
                      value={autoSync}
                      onValueChange={setAutoSync}
                      trackColor={{ false: colors.border, true: colors.primaryLight }}
                      thumbColor={autoSync ? colors.primary : colors.surfaceSecondary}
                    />
                  ) : (
                    <Text style={styles.menuChevron}>{'\u203A'}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <Text style={styles.appInfo}>SpotIt v1.0.0</Text>
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
    paddingBottom: spacing.xxl,
  },
  // Profile
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileEditButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  profileEditText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  // Menu
  menuSection: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  menuLabelDanger: {
    color: colors.danger,
  },
  menuChevron: {
    fontSize: 22,
    color: colors.textTertiary,
  },
  appInfo: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
});
