import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const sizeConfig: Record<ButtonSize, { height: number; fontSize: number; paddingHorizontal: number }> = {
  sm: { height: 36, fontSize: 14, paddingHorizontal: 12 },
  md: { height: 44, fontSize: 16, paddingHorizontal: 20 },
  lg: { height: 52, fontSize: 18, paddingHorizontal: 28 },
};

const variantStyles: Record<ButtonVariant, {
  bg: string;
  text: string;
  border?: string;
}> = {
  primary: { bg: colors.primary, text: '#FFFFFF' },
  secondary: { bg: colors.surfaceSecondary, text: colors.text },
  outline: { bg: colors.surface, text: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', text: colors.primary },
  danger: { bg: colors.danger, text: '#FFFFFF' },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  fullWidth = false,
  icon,
}: ButtonProps) {
  const sizeStyle = sizeConfig[size];
  const variantStyle = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border ?? 'transparent',
          borderWidth: variantStyle.border ? 1.5 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
        fullWidth && styles.fullWidth,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle.text}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[
              styles.title,
              { color: variantStyle.text, fontSize: sizeStyle.fontSize },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
  },
});
