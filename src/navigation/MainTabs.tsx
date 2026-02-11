import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import HomeStack from './HomeStack';
import RoomsStack from './RoomsStack';
import ScanStack from './ScanStack';
import SearchStack from './SearchStack';
import SettingsStack from './SettingsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ---------------------------------------------------------------------------
// Simple emoji-based tab icons (to be replaced with a proper icon library)
// ---------------------------------------------------------------------------
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '\u{1F3E0}',
    Rooms: '\u{1F6AA}',
    Scan: '\u{1F4F7}',
    Search: '\u{1F50D}',
    Settings: '\u{2699}\u{FE0F}',
  };

  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '?'}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Prominent center Scan button
// ---------------------------------------------------------------------------
function ScanTabButton(props: BottomTabBarButtonProps) {
  const { onPress, accessibilityState } = props;
  const focused = accessibilityState?.selected ?? false;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.scanButtonWrapper}
    >
      <View style={[styles.scanButton, focused && styles.scanButtonFocused]}>
        <Text style={styles.scanButtonIcon}>{'\u{1F4F7}'}</Text>
      </View>
      <Text style={[styles.scanLabel, focused && styles.scanLabelFocused]}>
        Scan
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main Tab Navigator
// ---------------------------------------------------------------------------
export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Rooms" component={RoomsStack} />
      <Tab.Screen
        name="Scan"
        component={ScanStack}
        options={{
          tabBarButton: (props) => <ScanTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  tabBar: {
    height: 88,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  scanButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonFocused: {
    backgroundColor: '#4338CA',
  },
  scanButtonIcon: {
    fontSize: 28,
  },
  scanLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  scanLabelFocused: {
    color: '#4F46E5',
  },
});
