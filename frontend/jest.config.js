export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^.+\\.(svg|css)$': '<rootDir>/__mocks__/fileMock.js',
    '^/vite.svg$': '<rootDir>/__mocks__/fileMock.js'
  }
};
