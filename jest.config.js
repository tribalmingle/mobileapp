module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:\.pnpm/)?(?:@react-native|react-native|@react-native-community|@react-navigation|@react-native/js-polyfills|expo(nent)?|@expo|@unimodules|unimodules|sentry-expo|native-base|react-native-.*|expo-router|@testing-library))'
  ],
};
