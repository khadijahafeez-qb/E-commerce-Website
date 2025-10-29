import nextJest from 'next/jest';

const createJestConfig = nextJest({
  dir: './', // path to your Next.js app
});

const config = {
  preset: 'ts-jest',
  testEnvironment: 'node', // node is fine for API tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

export default createJestConfig(config);
