# Testing Guide for Cardlayer

This guide explains how to run tests for the Cardlayer application.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
cardlayer/
├── tests/
│   ├── setup.js              # Global test setup
│   ├── unit/                 # Unit tests
│   │   ├── config.test.js
│   │   └── imageProcessing.test.js
│   ├── integration/          # Integration tests (TODO)
│   └── e2e/                  # End-to-end tests (TODO)
├── test-fixtures/            # Test images and data
├── vitest.config.js          # Vitest configuration
└── package.json              # Dependencies and scripts
```

## What's Tested

### ✅ config.js (100% coverage target)
- A4 dimension constants
- Card type definitions
- Grid and layout settings
- Ship name font settings
- Auto-placement configuration
- Physical dimension validation

### ✅ imageProcessing.js (80% coverage target)
- **Unit conversions**: `mmToPixels()`, `pixelsToMm()`
- **Alpha channel detection**: `hasAlphaChannel()`
- **Bounding box detection**: `findBoundingBox()`
- **Dimension calculations**: `calculateCardDimensions()`
- Edge cases: transparent images, rotated cards, circular dials

### 🚧 TODO: fileImporter.js
- File type detection
- Auto card type detection from filenames
- Multiple file handling
- Error handling for invalid files

### 🚧 TODO: pdfGeneration.js
- PDF creation with positioned cards
- Rotation handling in PDF
- Position mapping accuracy
- Multiple card types in same PDF

### 🚧 TODO: dragDrop.js
- Grid snapping logic
- Collision detection
- Boundary checking
- Rotated card collision bounds

## Running Specific Tests

```bash
# Run only config tests
npx vitest tests/unit/config.test.js

# Run only image processing tests
npx vitest tests/unit/imageProcessing.test.js

# Run tests matching a pattern
npx vitest --grep "Alpha Channel"

# Run tests in a specific file with watch mode
npx vitest tests/unit/config.test.js --watch
```

## Coverage Reports

After running `npm run test:coverage`, open the HTML coverage report:

```bash
# On macOS
open coverage/index.html

# On Linux
xdg-open coverage/index.html

# On Windows
start coverage/index.html
```

### Coverage Targets

| Module | Target | Current |
|--------|--------|---------|
| config.js | 100% | ✅ |
| imageProcessing.js | 80% | ✅ |
| fileImporter.js | 75% | 🚧 TODO |
| pdfGeneration.js | 80% | 🚧 TODO |
| dragDrop.js | 60% | 🚧 TODO |
| main.js | 50% | 🚧 TODO |

## Understanding Test Output

### Successful Test Run
```
✓ tests/unit/config.test.js (42 tests)
✓ tests/unit/imageProcessing.test.js (38 tests)

Test Files  2 passed (2)
     Tests  80 passed (80)
```

### Failed Test
```
❯ tests/unit/config.test.js (42 tests | 1 failed)
  ❯ Card Type Definitions
    × should have correct standard card dimensions
      AssertionError: expected 88 to be 63.5

Fix the implementation or update the test.
```

## Test-Driven Development Workflow

1. **Write a failing test** that describes the behavior you want
2. **Run the test** to confirm it fails (`npm test`)
3. **Write the minimum code** to make it pass
4. **Run tests again** to confirm it passes
5. **Refactor** if needed, keeping tests green

## Common Testing Patterns

### Testing a pure function
```javascript
it('should convert mm to pixels correctly', () => {
  const result = mmToPixels(25.4);
  expect(result).toBeCloseTo(96, 1);
});
```

### Testing async functions
```javascript
it('should trim image borders', async () => {
  const image = createMockImage(100, 100);
  const trimmed = await trimImageBorders(image);
  expect(trimmed.width).toBeLessThanOrEqual(100);
});
```

### Testing with mocks
```javascript
it('should call canvas methods', () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const drawSpy = vi.spyOn(ctx, 'drawImage');

  // Run code that uses canvas

  expect(drawSpy).toHaveBeenCalled();
});
```

## Debugging Tests

### View test output in browser
```bash
npm run test:ui
```

This opens a web interface at http://localhost:51204 where you can:
- See all tests and their status
- View detailed error messages
- Debug tests in browser DevTools
- Re-run individual tests

### Add debug logging
```javascript
it('should calculate dimensions', () => {
  const result = calculateCardDimensions(100, 200);
  console.log('Result:', result); // Will appear in test output
  expect(result.width).toBeGreaterThan(0);
});
```

### Use debugger
```javascript
it('should process image', () => {
  debugger; // Test will pause here if running in debug mode
  const result = processImage(testImage);
  expect(result).toBeDefined();
});
```

## Best Practices

1. **Test behavior, not implementation** - Focus on what the function does, not how
2. **One assertion per test** (when possible) - Makes failures easier to diagnose
3. **Use descriptive test names** - Should explain what's being tested
4. **Test edge cases** - Empty inputs, null values, boundary conditions
5. **Keep tests fast** - Unit tests should run in milliseconds
6. **Mock external dependencies** - Don't rely on files, networks, or browsers
7. **Don't test framework code** - Test your logic, not library functions

## Troubleshooting

### "Cannot find module" errors
```bash
# Make sure dependencies are installed
npm install

# Check that file paths are correct
# Use absolute paths from project root
```

### Canvas errors in tests
```bash
# The 'canvas' package is installed for Node.js canvas support
# If you see canvas-related errors, check that it's properly installed
npm install canvas
```

### Tests pass locally but fail in CI
- Check Node.js version matches
- Ensure all dependencies are in package.json
- Check for environment-specific code

## Next Steps

1. **Run the existing tests**: `npm test`
2. **Check coverage**: `npm run test:coverage`
3. **Add more tests** for fileImporter.js and pdfGeneration.js
4. **Set up CI/CD** with GitHub Actions to run tests automatically
5. **Write E2E tests** with Playwright for full user workflows

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Questions?** Check the [Vitest docs](https://vitest.dev/) or open an issue on the project repository.
