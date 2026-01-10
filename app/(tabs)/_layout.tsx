import { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import UniversalBottomNav from '@/components/universal/UniversalBottomNav';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

export default function TabsLayout() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    loadUser().catch(() => undefined);
  }, [loadUser]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => <UniversalBottomNav />}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
