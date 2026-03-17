import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: CardPadding;
}

const paddingValues: Record<CardPadding, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

export default function Card({
  children,
  onPress,
  style,
  padding = 'md',
}: CardProps) {
  const containerStyle: ViewStyle[] = [
    styles.card,
    { padding: paddingValues[padding] },
    style as ViewStyle,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyle,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
