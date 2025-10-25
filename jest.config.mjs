// jest.config.mjs (Kembalikan seperti ini)
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',

  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1', // <-- Pastikan ini ada lagi

    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  moduleDirectories: ['node_modules', '<rootDir>/'],
}

export default createJestConfig(config)