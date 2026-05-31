import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initDB } from '../db/client';
import { addEvent, triggerWidgetSync } from '../db/helpers';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const logToNative = (message: string) => {
  if (Platform.OS === 'android' && NativeModules.WidgetSyncModule && NativeModules.WidgetSyncModule.logMessage) {
    NativeModules.WidgetSyncModule.logMessage(message);
  } else {
    console.log(message);
  }
};

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
    
    // Listen for logging requests from the Android Widget
    const eventEmitter = new NativeEventEmitter(NativeModules.WidgetSyncModule);
    logToNative("Setting up NativeEventEmitter listener");
    const subscription = eventEmitter.addListener('onLogHabitFromWidget', (habitId) => {
      logToNative("EVENT RECEIVED: Widget log event received for habit: " + habitId);
      addEvent(habitId, 1.0, "Logged from widget");
      
      // Sync the widget data after updating the database
      triggerWidgetSync();
    });

    return () => subscription.remove();
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
