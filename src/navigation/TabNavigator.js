import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SearchScreen from '../screens/SearchScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2089DC', // よりモダンな青
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          backgroundColor: '#FFFFFF',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0, // Androidのシャドウを削除
          shadowOpacity: 0, // iOSのシャドウを削除
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        },
        headerTintColor: '#333333',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
