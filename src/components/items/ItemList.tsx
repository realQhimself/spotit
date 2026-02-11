import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import EmptyState from '../common/EmptyState';
import ItemCard from './ItemCard';

interface ItemData {
  id: string;
  name: string;
  category: string;
  roomName: string;
  zoneName?: string;
  layer?: number;
  thumbnailUri?: string;
  confidence?: number;
}

interface ItemListProps {
  items: ItemData[];
  onItemPress: (id: string) => void;
  emptyMessage?: string;
}

export default function ItemList({
  items,
  onItemPress,
  emptyMessage = 'No items found',
}: ItemListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        icon="📦"
        description="Items will appear here once you start scanning."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ItemCard
          name={item.name}
          category={item.category}
          roomName={item.roomName}
          zoneName={item.zoneName}
          layer={item.layer}
          thumbnailUri={item.thumbnailUri}
          confidence={item.confidence}
          onPress={() => onItemPress(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
    />
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 88, // thumbnail (60) + marginLeft (12) + padding (16)
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
