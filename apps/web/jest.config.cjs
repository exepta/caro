const { createCjsPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
const config = {
  ...createCjsPreset(),

  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/src/test.ts',
  ],

  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1',
  },
};

module.exports = config;
