import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use happy-dom for DOM environment
    environment: 'happy-dom',

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'test-fixtures/'
      ],
      include: ['js/**/*.js'],
      // Target coverage thresholds
      lines: 70,
      functions: 70,
      branches: 65,
      statements: 70
    },

    // Test file patterns
    include: ['tests/**/*.test.js'],

    // Setup files
    setupFiles: ['./tests/setup.js']
  }
});
