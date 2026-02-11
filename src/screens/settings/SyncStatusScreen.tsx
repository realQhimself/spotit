import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { SettingsStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<SettingsStackParamList, 'SyncStatus'>;

type SyncStatus = 'success' | 'warning' | 'error';

interface SyncDataRow {
  label: string;
  value: string;
  status: SyncStatus;
}

const SYNC_DATA: SyncDataRow[] = [
  { label: 'Last Sync', value: '2 minutes ago', status: 'success' },
  { label: 'Items Synced', value: '142 / 142', status: 'success' },
  { label: 'Photos Uploaded', value: '89 / 95', status: 'warning' },
  { label: 'Pending Changes', value: '3', status: 'warning' },
];

function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'success':
      return colors.success;
    case 'warning':
      return colors.warning;
    case 'error':
      return colors.danger;
  }
}

const PHOTO_UPLOADED = 89;
const PHOTO_TOTAL = 95;
const PHOTO_PERCENT = Math.round((PHOTO_UPLOADED / PHOTO_TOTAL) * 100);

export default function SyncStatusScreen({ navigation }: Props) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = () => {
    setIsSyncing(true);
    // Simulate sync
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status */}
        <View style={styles.connectionBanner}>
          <View style={[styles.connectionDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.connectionText, { color: colors.success }]}>
            Connected
          </Text>
        </View>

        {/* Sync Details Card */}
        <View style={styles.card}>
          {SYNC_DATA.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.row,
                index < SYNC_DATA.length - 1 && styles.rowBorder,
              ]}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              <View style={styles.rowRight}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                />
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Photo Upload Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Photo Upload Progress</Text>
            <Text style={styles.progressPercent}>{PHOTO_PERCENT}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${PHOTO_PERCENT}%` },
              ]}
            />
          </View>
          <Text style={styles.progressSubtext}>
            {PHOTO_UPLOADED} of {PHOTO_TOTAL} photos uploaded
          </Text>
        </View>

        {/* Sync Now Button */}
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <View style={styles.syncButtonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.syncButtonText}>Syncing...</Text>
            </View>
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>

        {/* Sync Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>RECENT ACTIVITY</Text>
          <View style={styles.activityCard}>
            {[
              { time: '2 min ago', action: 'Synced 3 new items', icon: '\u2705' },
              { time: '15 min ago', action: 'Uploaded 12 photos', icon: '\u{1F4F7}' },
              { time: '1 hour ago', action: 'Full sync completed', icon: '\u{1F504}' },
              { time: '3 hours ago', action: 'Synced room updates', icon: '\u{1F3E0}' },
            ].map((activity, index) => (
              <View
                key={index}
                style={[
                  styles.activityRow,
                  index < 3 && styles.activityRowBorder,
                ]}
              >
                <Text style={styles.activityIcon}>{activity.icon}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How Sync Works</Text>
          <Text style={styles.infoText}>
            Your items are saved locally first, then synced to the cloud when
            you're online. Photos are uploaded in the background to minimize
            data usage.
          </Text>
        </View>
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
    paddingBottom: spacing.xxl,
  },
  // Connection Banner
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  connectionText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLabel: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  rowValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  // Progress
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  progressPercent: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  // Sync Button
  syncButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  syncButtonDisabled: {
    opacity: 0.7,
  },
  syncButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  // Activity
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  activityInfo: {
    flex: 1,
  },
  activityAction: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  activityTime: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Info Card
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#3730A3',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: '#4338CA',
    lineHeight: 20,
  },
});
