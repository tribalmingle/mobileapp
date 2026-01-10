import { act } from 'react-test-renderer';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';

describe('authStore (demo mode)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore as any).__resetStore?.();
    useAuthStore.setState({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      error: null,
      pushToken: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('logs in demo user and sets auth state', async () => {
    await act(async () => {
      await useAuthStore.getState().login('sarah@example.com', 'password');
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('demo-user-2');
    expect(state.token).toMatch(/^demo-token/);
  });

  it('signs up and stores demo user data', async () => {
    await act(async () => {
      await useAuthStore
        .getState()
        .signup({ email: 'new@user.com', password: 'password', name: 'New User', age: 32, gender: 'male' });
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('new@user.com');
    expect((SecureStore as any).setItemAsync).toHaveBeenCalledWith('auth_token', expect.any(String));
  });

  it('loads saved demo user from secure store', async () => {
    const demoUser = { id: 'demo', email: 'demo@user.com', name: 'Demo', age: 35, gender: 'male' };
    await SecureStore.setItemAsync('auth_token', 'token-123');
    await SecureStore.setItemAsync('demo_user_data', JSON.stringify(demoUser));

    await act(async () => {
      await useAuthStore.getState().loadUser();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('demo@user.com');
    expect(state.token).toBe('token-123');
  });
});
