import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { initDB } from '../db/client';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    async function prepare() {
      try {
        initDB();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modals/add-habit" options={{ presentation: 'modal', title: 'Add Habit' }} />
      <Stack.Screen name="modals/edit-habit" options={{ presentation: 'modal', title: 'Edit Habit' }} />
      <Stack.Screen name="modals/settings" options={{ presentation: 'modal', title: 'Settings' }} />
    </Stack>
  );
}
