import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import MainTabs from './MainTabs';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root navigator that conditionally shows Auth or MainTabs.
 * For MVP we skip auth and go straight to MainTabs.
 */
export default function RootNavigator() {
  // Simple auth state -- skip for MVP
  const [isAuthenticated] = useState<boolean>(true);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        // Auth placeholder -- will be wired up later
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
