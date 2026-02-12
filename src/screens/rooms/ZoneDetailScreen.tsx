import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RoomsStackParamList } from '../../types/navigation';
import type Zone from '../../database/models/Zone';
import type Item from '../../database/models/Item';
import { getZoneById } from '../../database/helpers/zoneHelpers';
import { getItemsByZone } from '../../database/helpers/itemHelpers';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<RoomsStackParamList, 'ZoneDetail'>;

const ZONE_ICONS: Record<string, string> = {
  fridge: '\u{1F9CA}',
  cabinet: '\u{1F5C4}',
  surface: '\u{1F6CB}',
  drawer: '\u{1F4E6}',
  closet: '\u{1F6AA}',
  default: '\u{1F4E6}',
};

interface LayerGroup {
  layer: number;
  label: string;
  items: Item[];
}

function groupItemsByLayer(items: Item[]): LayerGroup[] {
  const map = new Map<number, Item[]>();
  for (const item of items) {
    const layer = item.layer ?? 0;
    if (!map.has(layer)) {
      map.set(layer, []);
    }
    map.get(layer)!.push(item);
  }

  const layers: LayerGroup[] = [];
  const sortedKeys = Array.from(map.keys()).sort((a, b) => a - b);
  for (const key of sortedKeys) {
    layers.push({
      layer: key,
      label: key === 0 ? 'Unsorted' : `Shelf ${key}`,
      items: map.get(key)!,
    });
  }
  return layers;
}

function ExpandableLayer({ layerGroup }: { layerGroup: LayerGroup }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.layerContainer}>
      <TouchableOpacity
        style={styles.layerHeader}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.layerHeaderLeft}>
          <Text style={styles.layerChevron}>{expanded ? '\u25BC' : '\u25B6'}</Text>
          <Text style={styles.layerLabel}>{layerGroup.label}</Text>
        </View>
        <View style={styles.layerBadge}>
          <Text style={styles.layerBadgeText}>{layerGroup.items.length}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.layerItems}>
          {layerGroup.items.map((item) => (
            <View key={item.id} style={styles.layerItem}>
              <View style={styles.itemDot} />
              <View style={styles.layerItemInfo}>
                <Text style={styles.layerItemName}>{item.name}</Text>
                <Text style={styles.layerItemCategory}>{item.category}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ZoneDetailScreen({ route }: Props) {
  const { zoneId } = route.params;

  const [zone, setZone] = useState<Zone | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    getZoneById(zoneId)
      .then(setZone)
      .catch((err) => console.error('Failed to load zone:', err));
  }, [zoneId]);

  useEffect(() => {
    const sub = getItemsByZone(zoneId).subscribe(setItems);
    return () => sub.unsubscribe();
  }, [zoneId]);

  const layers = groupItemsByLayer(items);
  const totalItems = items.length;
  const zoneIcon = ZONE_ICONS[zone?.zoneType ?? 'default'] || ZONE_ICONS.default;
  const zoneTypeName = zone?.zoneType
    ? zone.zoneType.charAt(0).toUpperCase() + zone.zoneType.slice(1)
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Zone Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>{zoneIcon}</Text>
          </View>
          <Text style={styles.headerName}>{zone?.name ?? 'Loading...'}</Text>
          <Text style={styles.headerType}>{zoneTypeName}</Text>
        </View>

        {/* Total Item Count */}
        <View style={styles.totalCountBar}>
          <Text style={styles.totalCountLabel}>Total Items</Text>
          <View style={styles.totalCountBadge}>
            <Text style={styles.totalCountText}>{totalItems}</Text>
          </View>
        </View>

        {/* Layers / Shelves */}
        <View style={styles.layersSection}>
          <Text style={styles.sectionTitle}>Shelves / Layers</Text>
          {layers.length === 0 ? (
            <View style={styles.emptyLayer}>
              <Text style={styles.emptyLayerText}>No items in this zone yet</Text>
            </View>
          ) : (
            layers.map((layerGroup) => (
              <ExpandableLayer key={layerGroup.layer} layerGroup={layerGroup} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Scan Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.scanButton} activeOpacity={0.8}>
          <Text style={styles.scanButtonIcon}>{'\u{1F4F7}'}</Text>
          <Text style={styles.scanButtonText}>Scan this Zone</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  headerIcon: {
    fontSize: 36,
  },
  headerName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerType: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  totalCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  totalCountLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  totalCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  totalCountText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  layersSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  layerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  layerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  layerChevron: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  layerLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  layerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  layerBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  layerItems: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  itemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  layerItemInfo: {
    flex: 1,
  },
  layerItemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  layerItemCategory: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 1,
  },
  emptyLayer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyLayerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  scanButtonIcon: {
    fontSize: 18,
  },
  scanButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
});
