import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import Badge from '../common/Badge';

interface ItemCardProps {
  name: string;
  category: string;
  roomName: string;
  zoneName?: string;
  layer?: number;
  thumbnailUri?: string;
  confidence?: number;
  onPress?: () => void;
}

export default function ItemCard({
  name,
  category,
  roomName,
  zoneName,
  layer,
  thumbnailUri,
  confidence,
  onPress,
}: ItemCardProps) {
  const locationParts = [roomName];
  if (zoneName) locationParts.push(zoneName);
  if (layer !== undefined && layer > 0) locationParts.push(`Shelf ${layer}`);
  const locationText = locationParts.join(' > ');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed && onPress ? 0.8 : 1 },
      ]}
      disabled={!onPress}
    >
      {/* Thumbnail */}
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholder]}>
          <Text style={styles.placeholderText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Info column */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {locationText}
        </Text>
        <View style={styles.meta}>
          <Badge label={category} variant="primary" size="sm" />
          {confidence !== undefined && confidence > 0 && (
            <Text style={styles.confidence}>
              {Math.round(confidence * 100)}%
            </Text>
          )}
        </View>
      </View>

      {/* Chevron */}
      {onPress && <Text style={styles.chevron}>{'>'}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  placeholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidence: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 18,
    color: colors.textTertiary,
    marginLeft: 8,
    fontWeight: '600',
  },
});
