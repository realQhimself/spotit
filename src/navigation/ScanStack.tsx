import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ScanStackParamList } from '../types/navigation';
import ScanModePickerScreen from '../screens/scan/ScanModePickerScreen';
import CameraScanScreen from '../screens/scan/CameraScanScreen';
import ScanReviewScreen from '../screens/scan/ScanReviewScreen';
import AreaTypePickerScreen from '../screens/scan/AreaTypePickerScreen';
import LayerSetupScreen from '../screens/scan/LayerSetupScreen';

const Stack = createStackNavigator<ScanStackParamList>();

export default function ScanStack() {
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
        name="ScanModePicker"
        component={ScanModePickerScreen}
        options={{ title: 'Choose Scan Mode' }}
      />
      <Stack.Screen
        name="CameraScan"
        component={CameraScanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ScanReview"
        component={ScanReviewScreen}
        options={{ title: 'Review Scan' }}
      />
      <Stack.Screen
        name="AreaTypePicker"
        component={AreaTypePickerScreen}
        options={{ title: 'Select Area Type' }}
      />
      <Stack.Screen
        name="LayerSetup"
        component={LayerSetupScreen}
        options={{ title: 'Layer Setup' }}
      />
    </Stack.Navigator>
  );
}
