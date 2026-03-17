import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { formatRelativeDate } from '../../utils/formatters';

interface RoomCardProps {
  name: string;
  itemCount: number;
  thumbnailUri?: string;
  lastScanned?: string;
  onPress?: () => void;
}

export default function RoomCard({
  name,
  itemCount,
  thumbnailUri,
  lastScanned,
  onPress,
}: RoomCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed && onPress ? 0.85 : 1 },
      ]}
      disabled={!onPress}
    >
      {/* Thumbnail area */}
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder]}>
          <Text style={styles.placeholderEmoji}>🏠</Text>
        </View>
      )}

      {/* Info area */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.count}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        {lastScanned && (
          <Text style={styles.scanned}>
            Scanned {formatRelativeDate(lastScanned)}
          </Text>
        )}
      </View>
    </Pressable>
  );
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
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 110,
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  count: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scanned: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
});
