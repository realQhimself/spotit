import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchStackParamList } from '../types/navigation';
import SearchScreen from '../screens/search/SearchScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';

const Stack = createStackNavigator<SearchStackParamList>();

export default function SearchStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchResults"
        component={SearchScreen}
        options={{ title: 'Search Results' }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Item Details' }}
      />
    </Stack.Navigator>
  );
}
