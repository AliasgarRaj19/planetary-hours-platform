import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { BLOG_TAB_NAME, BLOG_TAB_TITLE } from '@/features/blog/blog-navigation';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f6c46f',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#07111f',
          borderTopColor: 'rgba(255, 255, 255, 0.14)',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="planet-outline" size={size} />
          ),
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="calendar-outline" size={size} />
          ),
          title: 'Schedule',
        }}
      />
      <Tabs.Screen
        name={BLOG_TAB_NAME}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="newspaper-outline" size={size} />
          ),
          title: BLOG_TAB_TITLE,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings-outline" size={size} />
          ),
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
