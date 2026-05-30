import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDB } from '../db/client';

export default function RootLayout() {
  useEffect(() => {
    initDB();
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
