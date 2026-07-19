import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { PlanetaryProvider } from '@/features/planetary/planetary-state';
import { UpdateProvider } from '@/features/updates/update-state';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <PlanetaryProvider>
      <UpdateProvider>
        <ThemeProvider value={theme}>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#07111f',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: '800',
              },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="settings/app-updates" options={{ title: 'App Updates' }} />
            <Stack.Screen name="settings/location" options={{ title: 'Location' }} />
            <Stack.Screen name="settings/time-format" options={{ title: 'Time Format' }} />
            <Stack.Screen name="settings/about" options={{ title: 'About Planetary Hours' }} />
            <Stack.Screen name="settings/privacy-policy" options={{ title: 'Privacy Policy' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </UpdateProvider>
    </PlanetaryProvider>
  );
}
