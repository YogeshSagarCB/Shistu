import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { NativeEventEmitter, NativeModules, Platform, AppState, AppStateStatus } from 'react-native';
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
  const appState = useRef(AppState.currentState);

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
    
    // Listen for app state changes to re-init DB
    const subscriptionAppState = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        logToNative("App came to foreground, re-initializing DB");
        initDB(); // This re-opens connection and might help sync
      }
      appState.current = nextAppState;
    });

    // Listen for logging requests from the Android Widget
    const eventEmitter = new NativeEventEmitter(NativeModules.WidgetSyncModule);
    logToNative("Setting up NativeEventEmitter listener");
    const subscription = eventEmitter.addListener('onLogHabitFromWidget', (habitId) => {
      logToNative("EVENT RECEIVED: Widget log event received for habit: " + habitId);
      addEvent(habitId, 1.0, "Logged from widget");
      
      // Sync the widget data after updating the database
      triggerWidgetSync();
    });

    return () => {
        subscription.remove();
        subscriptionAppState.remove();
    };
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
