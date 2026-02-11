import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} size="sm" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: 20,
  },
});
