import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import UniversalBottomNav from '@/components/universal/UniversalBottomNav';
import { useAuthStore } from '@/store/authStore';

export default function TabsLayout() {
  const router = useRouter();
  const loadUser = useAuthStore((state) => state.loadUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    loadUser().catch(() => undefined);
  }, [loadUser]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, loading, router]);

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
