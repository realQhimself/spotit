import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

interface ZoneCardProps {
  name: string;
  zoneType: string;
  itemCount: number;
  layerCount: number;
  onPress?: () => void;
}

const zoneTypeEmojis: Record<string, string> = {
  fridge: '🧊',
  drawer: '🗄️',
  cabinet: '🚪',
  closet: '👔',
  bookshelf: '📚',
  desk: '🖥️',
  shelf: '📦',
  table: '🪑',
  counter: '🍽️',
  pantry: '🥫',
};

function getZoneEmoji(zoneType: string): string {
  const key = zoneType.toLowerCase();
  return zoneTypeEmojis[key] ?? '📍';
}

export default function ZoneCard({
  name,
  zoneType,
  itemCount,
  layerCount,
  onPress,
}: ZoneCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed && onPress ? 0.85 : 1 },
      ]}
      disabled={!onPress}
    >
      {/* Emoji icon */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{getZoneEmoji(zoneType)}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.type}>{zoneType}</Text>
      </View>

      {/* Counts */}
      <View style={styles.counts}>
        <Text style={styles.countValue}>{itemCount}</Text>
        <Text style={styles.countLabel}>
          {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.countValue}>{layerCount}</Text>
        <Text style={styles.countLabel}>
          {layerCount === 1 ? 'layer' : 'layers'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  type: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  counts: {
    alignItems: 'flex-end',
  },
  countValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  countLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
});
