import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from './src/mobile/theme';
import { HomeScreen } from './src/mobile/screens/HomeScreen';
import { DiscoverScreen } from './src/mobile/screens/DiscoverScreen';
import { FeedScreen } from './src/mobile/screens/FeedScreen';
import { StatsScreen } from './src/mobile/screens/StatsScreen';
import { ProfileScreen } from './src/mobile/screens/ProfileScreen';
import { MovieDetailScreen } from './src/mobile/screens/MovieDetailScreen';
import { TVDetailScreen } from './src/mobile/screens/TVDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgSurface,
          borderTopColor: COLORS.borderSubtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
        tabBarIcon: ({ focused, color }) => {
          let icon = '🏠';
          if (route.name === 'Home') icon = '🏠';
          else if (route.name === 'Discover') icon = '🔍';
          else if (route.name === 'Feed') icon = '📌';
          else if (route.name === 'Stats') icon = '📊';
          else if (route.name === 'Profile') icon = '👤';
          return <Text style={{ fontSize: 16 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.bgBase} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.bgSurface,
          },
          headerTintColor: COLORS.textMain,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MovieDetail"
          component={MovieDetailScreen}
          options={{ title: 'Movie Details' }}
        />
        <Stack.Screen
          name="TVDetail"
          component={TVDetailScreen}
          options={{ title: 'TV Series Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
