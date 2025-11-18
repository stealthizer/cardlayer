// Global test setup file
import { beforeAll, afterEach } from 'vitest';

// Mock canvas for Node.js environment
beforeAll(() => {
  // Canvas is provided by the 'canvas' package for Node.js testing
  // happy-dom provides basic DOM APIs

  // Mock ImageData if not available
  if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
      constructor(dataOrWidth, widthOrHeight, height) {
        if (dataOrWidth instanceof Uint8ClampedArray) {
          this.data = dataOrWidth;
          this.width = widthOrHeight;
          this.height = height;
        } else {
          this.width = dataOrWidth;
          this.height = widthOrHeight;
          this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4);
        }
      }
    };
  }
});

// Clean up after each test
afterEach(() => {
  // Clear any DOM modifications
  document.body.innerHTML = '';
});

// Global test utilities
global.createMockImage = (width, height) => {
  const img = new Image();
  Object.defineProperty(img, 'width', { value: width, writable: false });
  Object.defineProperty(img, 'height', { value: height, writable: false });
  return img;
};

global.createMockImageData = (width, height, fillAlpha = 255) => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // R
    data[i + 1] = 255; // G
    data[i + 2] = 255; // B
    data[i + 3] = fillAlpha; // A
  }
  return new ImageData(data, width, height);
};
