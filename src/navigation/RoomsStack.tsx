import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RoomsStackParamList } from '../types/navigation';
import RoomListScreen from '../screens/rooms/RoomListScreen';
import RoomDetailScreen from '../screens/rooms/RoomDetailScreen';
import ZoneDetailScreen from '../screens/rooms/ZoneDetailScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';

const Stack = createStackNavigator<RoomsStackParamList>();

export default function RoomsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="RoomList"
        component={RoomListScreen}
        options={{ title: 'My Rooms' }}
      />
      <Stack.Screen
        name="RoomDetail"
        component={RoomDetailScreen}
        options={{ title: 'Room' }}
      />
      <Stack.Screen
        name="ZoneDetail"
        component={ZoneDetailScreen}
        options={{ title: 'Zone' }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Item Details' }}
      />
    </Stack.Navigator>
  );
}
