import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { trackScreen } from '@/lib/analytics';

// Tracks route changes and emits a screen_view analytics event.
export const useScreenTracking = () => {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackScreen(pathname.replace(/^\//, '') || 'root');
  }, [pathname]);
};
