import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
