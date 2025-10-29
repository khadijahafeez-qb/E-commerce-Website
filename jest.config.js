const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Transform all necessary packages including jose
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|jose|oauth4webapi)/)'
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
    }],
  },
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts'],
};

export default jestConfig;