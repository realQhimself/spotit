import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsStackParamList } from '../types/navigation';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SyncStatusScreen from '../screens/settings/SyncStatusScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

function ProfileScreen() {
  return (
    <View style={placeholderStyles.container}>
      <Text style={placeholderStyles.emoji}>{'\u{1F464}'}</Text>
      <Text style={placeholderStyles.title}>Profile</Text>
      <Text style={placeholderStyles.subtitle}>Edit your profile details here</Text>
    </View>
  );
}

export default function SettingsStack() {
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
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="SyncStatus"
        component={SyncStatusScreen}
        options={{ title: 'Sync Status' }}
      />
    </Stack.Navigator>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
