import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';

const syncData = [
  { label: 'Last Sync', value: '2 minutes ago', status: 'success' as const },
  { label: 'Items Synced', value: '142 / 142', status: 'success' as const },
  { label: 'Photos Uploaded', value: '89 / 95', status: 'warning' as const },
  { label: 'Pending Changes', value: '3', status: 'warning' as const },
];

export default function SyncStatusScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Connected</Text>
      </View>

      <View style={styles.card}>
        {syncData.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.row,
              index < syncData.length - 1 && styles.rowBorder,
            ]}
          >
            <Text style={styles.rowLabel}>{item.label}</Text>
            <View style={styles.rowRight}>
              <View
                style={[
                  styles.dot,
                  item.status === 'success' ? styles.dotSuccess : styles.dotWarning,
                ]}
              />
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Photo Upload Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '94%' }]} />
        </View>
        <Text style={styles.progressText}>89 of 95 photos uploaded</Text>
      </View>

      <TouchableOpacity style={styles.syncButton} activeOpacity={0.8}>
        <Text style={styles.syncButtonText}>Sync Now</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How Sync Works</Text>
        <Text style={styles.infoText}>
          Your items are saved locally first, then synced to the cloud when
          you're online. Photos are uploaded in the background.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotSuccess: {
    backgroundColor: '#10B981',
  },
  dotWarning: {
    backgroundColor: '#F59E0B',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
  },
  syncButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3730A3',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 20,
  },
});
