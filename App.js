/**
 * App.js — Root Component (Expo)
 *
 * Responsibility: Mount global providers and the navigation container.
 * Provider order: SafeAreaProvider → SocketProvider → AppNavigator
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SocketProvider>
        <AppNavigator />
      </SocketProvider>
    </SafeAreaProvider>
  );
}
