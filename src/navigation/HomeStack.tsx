import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../types/navigation';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ItemDetailScreen from '../screens/items/ItemDetailScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeStack() {
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
        name="HomeScreen"
        component={HomeScreen}
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
