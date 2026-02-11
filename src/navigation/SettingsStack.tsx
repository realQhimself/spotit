import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import type { SettingsStackParamList } from '../types/navigation';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SyncStatusScreen from '../screens/settings/SyncStatusScreen';

const Stack = createStackNavigator<SettingsStackParamList>();

// ---------------------------------------------------------------------------
// Placeholder Profile screen (to be replaced with a full implementation)
// ---------------------------------------------------------------------------
function ProfileScreen() {
  return (
    <View style={placeholderStyles.container}>
      <View style={placeholderStyles.avatarCircle}>
        <Text style={placeholderStyles.avatarText}>U</Text>
      </View>
      <Text style={placeholderStyles.title}>Profile</Text>
      <Text style={placeholderStyles.subtitle}>
        Edit your profile details here
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Settings Stack Navigator
// ---------------------------------------------------------------------------
export default function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: fontWeight.bold,
          fontSize: fontSize.xl,
        },
        headerBackTitle: '',
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
