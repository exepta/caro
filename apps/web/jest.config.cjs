const { createCjsPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
const config = {
  ...createCjsPreset(),

  collectCoverage: true,
  coverageDirectory: 'playwright/coverage',
  coverageReporters: ['lcov', 'text', 'text-summary'],
  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/src/test.ts',
    '<rootDir>/playwright/',
  ],

  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
  },
};

module.exports = config;
