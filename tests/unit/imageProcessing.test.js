import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load config and imageProcessing modules
let mmToPixels, pixelsToMm, hasAlphaChannel, findBoundingBox, calculateCardDimensions;
let DPI, CARD_TYPES;

beforeAll(() => {
  // Load config.js first (imageProcessing depends on it)
  const configPath = join(process.cwd(), 'js/config.js');
  const configCode = readFileSync(configPath, 'utf-8');

  // Load imageProcessing.js
  const imgProcPath = join(process.cwd(), 'js/imageProcessing.js');
  const imgProcCode = readFileSync(imgProcPath, 'utf-8');

  // Combine and evaluate both files
  const combined = new Function(configCode + '\n' + imgProcCode + `
    return {
      mmToPixels,
      pixelsToMm,
      hasAlphaChannel,
      findBoundingBox,
      calculateCardDimensions,
      DPI,
      CARD_TYPES
    };
  `);

  const modules = combined();

  // Assign to test scope
  mmToPixels = modules.mmToPixels;
  pixelsToMm = modules.pixelsToMm;
  hasAlphaChannel = modules.hasAlphaChannel;
  findBoundingBox = modules.findBoundingBox;
  calculateCardDimensions = modules.calculateCardDimensions;
  DPI = modules.DPI;
  CARD_TYPES = modules.CARD_TYPES;
});

describe('Unit Conversion Functions', () => {
  describe('mmToPixels', () => {
    it('should convert millimeters to pixels correctly', () => {
      // At 96 DPI: 1 inch = 25.4mm = 96px
      // So 25.4mm should equal 96px
      expect(mmToPixels(25.4)).toBeCloseTo(96, 1);
    });

    it('should return 0 for 0mm', () => {
      expect(mmToPixels(0)).toBe(0);
    });

    it('should handle standard card width', () => {
      // 63.5mm standard card width
      const pixels = mmToPixels(63.5);
      expect(pixels).toBeGreaterThan(0);
      expect(pixels).toBeCloseTo(240, 1);
    });

    it('should handle A4 dimensions', () => {
      // 297mm × 210mm A4 paper
      const widthPx = mmToPixels(297);
      const heightPx = mmToPixels(210);

      expect(widthPx).toBeGreaterThan(heightPx);
      expect(widthPx).toBeCloseTo(1122.5, 1);
      expect(heightPx).toBeCloseTo(793.7, 1);
    });
  });

  describe('pixelsToMm', () => {
    it('should convert pixels to millimeters correctly', () => {
      // At 96 DPI: 96px should equal 25.4mm
      expect(pixelsToMm(96)).toBeCloseTo(25.4, 1);
    });

    it('should return 0 for 0 pixels', () => {
      expect(pixelsToMm(0)).toBe(0);
    });

    it('should be inverse of mmToPixels', () => {
      const originalMm = 63.5;
      const pixels = mmToPixels(originalMm);
      const convertedBackMm = pixelsToMm(pixels);

      expect(convertedBackMm).toBeCloseTo(originalMm, 5);
    });

    it('should handle large pixel values', () => {
      const pixels = 1123; // Approximately A4 width
      const mm = pixelsToMm(pixels);

      expect(mm).toBeGreaterThan(0);
      expect(mm).toBeCloseTo(297.1, 0.5);
    });
  });

  describe('Conversion Symmetry', () => {
    it('should maintain symmetry for multiple conversions', () => {
      const testValues = [10, 50, 100, 200, 500];

      testValues.forEach(mm => {
        const pixels = mmToPixels(mm);
        const backToMm = pixelsToMm(pixels);
        expect(backToMm).toBeCloseTo(mm, 5);
      });
    });
  });
});

describe('Alpha Channel Detection', () => {
  describe('hasAlphaChannel', () => {
    it('should return false for fully opaque image', () => {
      const imageData = createMockImageData(10, 10, 255);
      expect(hasAlphaChannel(imageData)).toBe(false);
    });

    it('should return true for image with transparency', () => {
      const imageData = createMockImageData(10, 10, 255);
      // Make one pixel semi-transparent
      imageData.data[3] = 128;

      expect(hasAlphaChannel(imageData)).toBe(true);
    });

    it('should return true for fully transparent image', () => {
      const imageData = createMockImageData(10, 10, 0);
      expect(hasAlphaChannel(imageData)).toBe(true);
    });

    it('should return true if any pixel is not fully opaque', () => {
      const imageData = createMockImageData(100, 100, 255);
      // Make last pixel transparent
      imageData.data[imageData.data.length - 1] = 254;

      expect(hasAlphaChannel(imageData)).toBe(true);
    });
  });
});

describe('Bounding Box Detection', () => {
  describe('findBoundingBox', () => {
    it('should return full dimensions for fully opaque image', () => {
      const width = 100;
      const height = 100;
      const imageData = createMockImageData(width, height, 255);

      const bbox = findBoundingBox(imageData);

      expect(bbox.x).toBe(0);
      expect(bbox.y).toBe(0);
      expect(bbox.width).toBe(width);
      expect(bbox.height).toBe(height);
    });

    it('should return zero dimensions for fully transparent image', () => {
      const imageData = createMockImageData(100, 100, 0);
      const bbox = findBoundingBox(imageData);

      expect(bbox.x).toBe(0);
      expect(bbox.y).toBe(0);
      expect(bbox.width).toBe(0);
      expect(bbox.height).toBe(0);
    });

    it('should find bounding box with transparent borders', () => {
      const width = 100;
      const height = 100;
      const imageData = createMockImageData(width, height, 0);

      // Create a 20x20 opaque square in the center
      for (let y = 40; y < 60; y++) {
        for (let x = 40; x < 60; x++) {
          const index = (y * width + x) * 4;
          imageData.data[index + 3] = 255; // Set alpha to opaque
        }
      }

      const bbox = findBoundingBox(imageData);

      expect(bbox.x).toBe(40);
      expect(bbox.y).toBe(40);
      expect(bbox.width).toBe(20);
      expect(bbox.height).toBe(20);
    });

    it('should handle single opaque pixel', () => {
      const width = 10;
      const height = 10;
      const imageData = createMockImageData(width, height, 0);

      // Make one pixel opaque at position (5, 5)
      const index = (5 * width + 5) * 4;
      imageData.data[index + 3] = 255;

      const bbox = findBoundingBox(imageData);

      expect(bbox.x).toBe(5);
      expect(bbox.y).toBe(5);
      expect(bbox.width).toBe(1);
      expect(bbox.height).toBe(1);
    });

    it('should handle opaque pixel in corner', () => {
      const width = 50;
      const height = 50;
      const imageData = createMockImageData(width, height, 0);

      // Top-left corner
      imageData.data[3] = 255;

      const bbox = findBoundingBox(imageData);

      expect(bbox.x).toBe(0);
      expect(bbox.y).toBe(0);
      expect(bbox.width).toBeGreaterThan(0);
      expect(bbox.height).toBeGreaterThan(0);
    });

    it('should handle L-shaped opaque region', () => {
      const width = 20;
      const height = 20;
      const imageData = createMockImageData(width, height, 0);

      // Create L-shape: vertical line (x=5, y=0-19) and horizontal line (x=5-19, y=19)
      for (let y = 0; y < height; y++) {
        const index = (y * width + 5) * 4;
        imageData.data[index + 3] = 255;
      }
      for (let x = 5; x < width; x++) {
        const index = (19 * width + x) * 4;
        imageData.data[index + 3] = 255;
      }

      const bbox = findBoundingBox(imageData);

      expect(bbox.x).toBe(5);
      expect(bbox.y).toBe(0);
      expect(bbox.width).toBe(15); // x from 5 to 19
      expect(bbox.height).toBe(20); // y from 0 to 19
    });
  });
});

describe('Card Dimension Calculations', () => {
  describe('calculateCardDimensions - Standard Cards', () => {
    it('should calculate dimensions for vertical standard card', () => {
      // Portrait orientation (taller than wide)
      const result = calculateCardDimensions(635, 880, 'standard');

      expect(result.isRotated).toBe(false);
      expect(result.cardType).toBe('standard');
      expect(result.cardWidthMm).toBe(63.5);
      expect(result.cardHeightMm).toBe(88);
      expect(result.width).toBeCloseTo(mmToPixels(63.5), 1);
      expect(result.height).toBeCloseTo(mmToPixels(88), 1);
    });

    it('should detect horizontal standard card and mark as rotated', () => {
      // Landscape orientation (wider than tall)
      const result = calculateCardDimensions(880, 635, 'standard');

      expect(result.isRotated).toBe(true);
      expect(result.cardWidthMm).toBe(88); // Swapped
      expect(result.cardHeightMm).toBe(63.5); // Swapped
    });

    it('should preserve original dimensions', () => {
      const originalWidth = 1000;
      const originalHeight = 1400;
      const result = calculateCardDimensions(originalWidth, originalHeight, 'standard');

      expect(result.originalWidth).toBe(originalWidth);
      expect(result.originalHeight).toBe(originalHeight);
    });
  });

  describe('calculateCardDimensions - Ships', () => {
    it('should calculate small ship dimensions', () => {
      const result = calculateCardDimensions(320, 380, 'small-ship');

      expect(result.cardType).toBe('small-ship');
      expect(result.cardWidthMm).toBe(32);
      expect(result.cardHeightMm).toBe(38);
    });

    it('should calculate medium ship dimensions', () => {
      const result = calculateCardDimensions(540, 610, 'medium-ship');

      expect(result.cardType).toBe('medium-ship');
      expect(result.cardWidthMm).toBe(54);
      expect(result.cardHeightMm).toBe(61);
    });

    it('should calculate large ship dimensions', () => {
      const result = calculateCardDimensions(730, 800, 'large-ship');

      expect(result.cardType).toBe('large-ship');
      expect(result.cardWidthMm).toBe(73);
      expect(result.cardHeightMm).toBe(80);
    });

    it('should calculate huge ship dimensions', () => {
      const result = calculateCardDimensions(805, 2240, 'huge-ship');

      expect(result.cardType).toBe('huge-ship');
      expect(result.cardWidthMm).toBe(80.5);
      expect(result.cardHeightMm).toBe(224);
    });
  });

  describe('calculateCardDimensions - Dials', () => {
    it('should calculate inner dial dimensions (circular)', () => {
      const result = calculateCardDimensions(430, 430, 'inner-dial');

      expect(result.cardType).toBe('inner-dial');
      expect(result.isRotated).toBe(false);
      expect(result.cardWidthMm).toBe(43);
      expect(result.cardHeightMm).toBe(43);
    });

    it('should calculate front dial dimensions (circular)', () => {
      const result = calculateCardDimensions(500, 500, 'front-dial');

      expect(result.cardType).toBe('front-dial');
      expect(result.isRotated).toBe(false);
      expect(result.cardWidthMm).toBe(50);
      expect(result.cardHeightMm).toBe(50);
    });

    it('should never mark dials as rotated', () => {
      // Even with non-square input
      const innerResult = calculateCardDimensions(400, 500, 'inner-dial');
      const frontResult = calculateCardDimensions(600, 400, 'front-dial');

      expect(innerResult.isRotated).toBe(false);
      expect(frontResult.isRotated).toBe(false);
    });

    it('should maintain square dimensions for dials', () => {
      const innerResult = calculateCardDimensions(430, 430, 'inner-dial');
      const frontResult = calculateCardDimensions(500, 500, 'front-dial');

      expect(innerResult.width).toBe(innerResult.height);
      expect(frontResult.width).toBe(frontResult.height);
    });
  });

  describe('calculateCardDimensions - Default Behavior', () => {
    it('should default to standard card when type not specified', () => {
      const result = calculateCardDimensions(635, 880);

      expect(result.cardType).toBe('standard');
    });

    it('should return pixel dimensions greater than zero', () => {
      const result = calculateCardDimensions(1000, 1000, 'standard');

      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should maintain aspect ratio category', () => {
      // Tall card should remain tall, wide card should remain wide
      const tallResult = calculateCardDimensions(500, 1000, 'standard');
      const wideResult = calculateCardDimensions(1000, 500, 'standard');

      const tallRatio = tallResult.height / tallResult.width;
      const wideRatio = wideResult.height / wideResult.width;

      expect(tallRatio).toBeGreaterThan(1);
      expect(wideRatio).toBeLessThan(1);
    });
  });

  describe('calculateCardDimensions - All Card Types', () => {
    it('should work with all defined card types', () => {
      const cardTypes = Object.keys(CARD_TYPES);

      cardTypes.forEach(type => {
        const cardData = CARD_TYPES[type];
        const result = calculateCardDimensions(
          cardData.width * 10,
          cardData.height * 10,
          type
        );

        expect(result.cardType).toBe(type);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      });
    });
  });
});

describe('Integration Tests', () => {
  describe('MM to Pixels to MM Round Trip', () => {
    it('should maintain precision through conversion cycle', () => {
      const cardTypes = Object.keys(CARD_TYPES);

      cardTypes.forEach(type => {
        const cardData = CARD_TYPES[type];
        const widthPx = mmToPixels(cardData.width);
        const heightPx = mmToPixels(cardData.height);
        const widthMm = pixelsToMm(widthPx);
        const heightMm = pixelsToMm(heightPx);

        expect(widthMm).toBeCloseTo(cardData.width, 2);
        expect(heightMm).toBeCloseTo(cardData.height, 2);
      });
    });
  });

  describe('Card Dimensions Match Config', () => {
    it('should calculate pixel dimensions matching config specs', () => {
      Object.entries(CARD_TYPES).forEach(([type, cardData]) => {
        const result = calculateCardDimensions(
          cardData.width * 10,
          cardData.height * 10,
          type
        );

        const expectedWidthPx = mmToPixels(cardData.width);
        const expectedHeightPx = mmToPixels(cardData.height);

        expect(result.width).toBeCloseTo(expectedWidthPx, 1);
        expect(result.height).toBeCloseTo(expectedHeightPx, 1);
      });
    });
  });
});
