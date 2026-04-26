/**
 * src/navigation/AppNavigator.jsx
 * ================================
 * Root navigation structure for the Linux Phone Link mobile app.
 *
 * Phase 1:   Single HomeScreen registered in the stack.
 * Phase 2:   SettingsScreen added — reachable via ⚙ button in header.
 */

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen     from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import COLORS from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle:       { backgroundColor: COLORS.surface },
          headerTintColor:   COLORS.textPrimary,
          headerTitleStyle:  { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle:      { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: '🐧  Linux Phone Link',
            headerBackVisible: false,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={{ paddingHorizontal: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 20 }}>⚙️</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: '⚙️  Server Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
