(global as any).__DEV__ = true;

require('@testing-library/jest-native/extend-expect');

jest.mock('expo-router', () => {
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    Link: ({ children }: any) => children,
    Stack: { Screen: ({ children }: any) => children },
  };
});

jest.mock('expo-secure-store');
