import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surfaceSecondary, text: colors.textSecondary },
  primary: { bg: '#EEF2FF', text: colors.primary },
  success: { bg: '#ECFDF5', text: colors.success },
  warning: { bg: '#FFFBEB', text: '#B45309' },
  danger: { bg: '#FEF2F2', text: colors.danger },
};

export default function Badge({
  label,
  variant = 'default',
  size = 'sm',
}: BadgeProps) {
  const vStyle = variantStyles[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyle.bg,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: vStyle.text,
            fontSize: isSmall ? 11 : 13,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});
