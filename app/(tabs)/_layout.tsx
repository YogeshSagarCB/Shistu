import { Tabs, useRouter } from 'expo-router';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#121212',
          borderBottomColor: '#333',
        },
        headerTitleStyle: {
          color: '#FFF',
          fontSize: 20,
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => router.push('/modals/settings')}
            style={{ marginRight: 20 }}
          >
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333333',
          height: 70,
          // Remove padding so the background can fill the space
        },
        tabBarActiveBackgroundColor: '#4DA8DA33', // Darker rectangular highlight
        tabBarActiveTintColor: '#4DA8DA',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 10, // Adjust label position
        },
        tabBarIconStyle: {
          marginTop: 10, // Adjust icon position
        },
        tabBarItemStyle: {
          // This ensures items fill the horizontal space and touch each other
          height: 70,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>📝</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>📊</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 24 }}>✨</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
