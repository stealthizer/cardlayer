import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load config.js as text and execute it in global scope
let A4_WIDTH_MM, A4_HEIGHT_MM, DPI, CARD_TYPES, BASE_TILE_SIZE_MAP, GRID_SIZE;
let TOOL_LAYOUT_WIDTH, A4_LAYOUT_WIDTH, LAYOUT_PADDING, BOTTOM_PADDING;
let CLONE_OFFSET_X, CLONE_OFFSET_Y, CONTROL_OFFSET;
let SHIP_NAME_TOP_OFFSET_SCREEN_MM, SHIP_NAME_TOP_OFFSET_PDF_MM;
let SHIP_NAME_FONT_SIZE_SCREEN, SHIP_NAME_FONT_SIZE_PDF;
let SHIP_NAME_LINE_HEIGHT_MULTIPLIER, SHIP_NAME_MAX_WIDTH_SCREEN, SHIP_NAME_MAX_WIDTH_PDF;
let SHIP_NAME_FONT_FAMILY, AUTO_PLACEMENT_PADDING, AUTO_PLACEMENT_GRID_STEP;
let COLLISION_SEARCH_MAX_ATTEMPTS, TEXT_CANVAS_SCALE, LAST_UPDATED_DATE;

beforeAll(() => {
  const configPath = join(process.cwd(), 'js/config.js');
  const configCode = readFileSync(configPath, 'utf-8');

  // Use Function constructor to evaluate in proper scope
  const globalEval = new Function(configCode + `
    return {
      A4_WIDTH_MM,
      A4_HEIGHT_MM,
      DPI,
      CARD_TYPES,
      BASE_TILE_SIZE_MAP,
      GRID_SIZE,
      TOOL_LAYOUT_WIDTH,
      A4_LAYOUT_WIDTH,
      LAYOUT_PADDING,
      BOTTOM_PADDING,
      CLONE_OFFSET_X,
      CLONE_OFFSET_Y,
      CONTROL_OFFSET,
      SHIP_NAME_TOP_OFFSET_SCREEN_MM,
      SHIP_NAME_TOP_OFFSET_PDF_MM,
      SHIP_NAME_FONT_SIZE_SCREEN,
      SHIP_NAME_FONT_SIZE_PDF,
      SHIP_NAME_LINE_HEIGHT_MULTIPLIER,
      SHIP_NAME_MAX_WIDTH_SCREEN,
      SHIP_NAME_MAX_WIDTH_PDF,
      SHIP_NAME_FONT_FAMILY,
      AUTO_PLACEMENT_PADDING,
      AUTO_PLACEMENT_GRID_STEP,
      COLLISION_SEARCH_MAX_ATTEMPTS,
      TEXT_CANVAS_SCALE,
      LAST_UPDATED_DATE
    };
  `);

  const config = globalEval();

  // Assign to test scope
  A4_WIDTH_MM = config.A4_WIDTH_MM;
  A4_HEIGHT_MM = config.A4_HEIGHT_MM;
  DPI = config.DPI;
  CARD_TYPES = config.CARD_TYPES;
  BASE_TILE_SIZE_MAP = config.BASE_TILE_SIZE_MAP;
  GRID_SIZE = config.GRID_SIZE;
  TOOL_LAYOUT_WIDTH = config.TOOL_LAYOUT_WIDTH;
  A4_LAYOUT_WIDTH = config.A4_LAYOUT_WIDTH;
  LAYOUT_PADDING = config.LAYOUT_PADDING;
  BOTTOM_PADDING = config.BOTTOM_PADDING;
  CLONE_OFFSET_X = config.CLONE_OFFSET_X;
  CLONE_OFFSET_Y = config.CLONE_OFFSET_Y;
  CONTROL_OFFSET = config.CONTROL_OFFSET;
  SHIP_NAME_TOP_OFFSET_SCREEN_MM = config.SHIP_NAME_TOP_OFFSET_SCREEN_MM;
  SHIP_NAME_TOP_OFFSET_PDF_MM = config.SHIP_NAME_TOP_OFFSET_PDF_MM;
  SHIP_NAME_FONT_SIZE_SCREEN = config.SHIP_NAME_FONT_SIZE_SCREEN;
  SHIP_NAME_FONT_SIZE_PDF = config.SHIP_NAME_FONT_SIZE_PDF;
  SHIP_NAME_LINE_HEIGHT_MULTIPLIER = config.SHIP_NAME_LINE_HEIGHT_MULTIPLIER;
  SHIP_NAME_MAX_WIDTH_SCREEN = config.SHIP_NAME_MAX_WIDTH_SCREEN;
  SHIP_NAME_MAX_WIDTH_PDF = config.SHIP_NAME_MAX_WIDTH_PDF;
  SHIP_NAME_FONT_FAMILY = config.SHIP_NAME_FONT_FAMILY;
  AUTO_PLACEMENT_PADDING = config.AUTO_PLACEMENT_PADDING;
  AUTO_PLACEMENT_GRID_STEP = config.AUTO_PLACEMENT_GRID_STEP;
  COLLISION_SEARCH_MAX_ATTEMPTS = config.COLLISION_SEARCH_MAX_ATTEMPTS;
  TEXT_CANVAS_SCALE = config.TEXT_CANVAS_SCALE;
  LAST_UPDATED_DATE = config.LAST_UPDATED_DATE;
});

describe('Config Constants', () => {
  describe('A4 Dimensions', () => {
    it('should have correct A4 width in landscape mode', () => {
      expect(A4_WIDTH_MM).toBe(297);
    });

    it('should have correct A4 height in landscape mode', () => {
      expect(A4_HEIGHT_MM).toBe(210);
    });

    it('should use standard screen DPI', () => {
      expect(DPI).toBe(96);
    });
  });

  describe('Grid Settings', () => {
    it('should have grid size of 10 pixels', () => {
      expect(GRID_SIZE).toBe(10);
    });
  });

  describe('Layout Settings', () => {
    it('should allocate 30% width to tool layout', () => {
      expect(TOOL_LAYOUT_WIDTH).toBe(0.3);
    });

    it('should allocate 70% width to A4 layout', () => {
      expect(A4_LAYOUT_WIDTH).toBe(0.7);
    });

    it('should sum to 100%', () => {
      expect(TOOL_LAYOUT_WIDTH + A4_LAYOUT_WIDTH).toBe(1.0);
    });

    it('should have reasonable padding values', () => {
      expect(LAYOUT_PADDING).toBeGreaterThan(0);
      expect(BOTTOM_PADDING).toBeGreaterThan(0);
    });
  });
});

describe('Card Type Definitions', () => {
  it('should define all required card types', () => {
    const requiredTypes = [
      'standard',
      'small-ship',
      'medium-ship',
      'large-ship',
      'huge-ship',
      'inner-dial',
      'front-dial'
    ];

    requiredTypes.forEach(type => {
      expect(CARD_TYPES).toHaveProperty(type);
    });
  });

  describe('Standard Card', () => {
    it('should have correct dimensions', () => {
      expect(CARD_TYPES['standard'].width).toBe(63.5);
      expect(CARD_TYPES['standard'].height).toBe(88);
    });

    it('should have name and description', () => {
      expect(CARD_TYPES['standard'].name).toBeTruthy();
      expect(CARD_TYPES['standard'].description).toBeTruthy();
    });
  });

  describe('X-Wing Ships', () => {
    it('should have correct small ship dimensions', () => {
      expect(CARD_TYPES['small-ship'].width).toBe(32);
      expect(CARD_TYPES['small-ship'].height).toBe(38);
    });

    it('should have correct medium ship dimensions', () => {
      expect(CARD_TYPES['medium-ship'].width).toBe(54);
      expect(CARD_TYPES['medium-ship'].height).toBe(61);
    });

    it('should have correct large ship dimensions', () => {
      expect(CARD_TYPES['large-ship'].width).toBe(73);
      expect(CARD_TYPES['large-ship'].height).toBe(80);
    });

    it('should have correct huge ship dimensions', () => {
      expect(CARD_TYPES['huge-ship'].width).toBe(80.5);
      expect(CARD_TYPES['huge-ship'].height).toBe(224);
    });
  });

  describe('X-Wing Dials', () => {
    it('should have correct inner dial dimensions (circular)', () => {
      expect(CARD_TYPES['inner-dial'].width).toBe(43);
      expect(CARD_TYPES['inner-dial'].height).toBe(43);
    });

    it('should have correct front dial dimensions (circular)', () => {
      expect(CARD_TYPES['front-dial'].width).toBe(50);
      expect(CARD_TYPES['front-dial'].height).toBe(50);
    });

    it('should have square dimensions for circular dials', () => {
      expect(CARD_TYPES['inner-dial'].width).toBe(CARD_TYPES['inner-dial'].height);
      expect(CARD_TYPES['front-dial'].width).toBe(CARD_TYPES['front-dial'].height);
    });
  });

  describe('Card Type Validation', () => {
    it('should have positive dimensions for all card types', () => {
      Object.entries(CARD_TYPES).forEach(([type, data]) => {
        expect(data.width).toBeGreaterThan(0);
        expect(data.height).toBeGreaterThan(0);
      });
    });

    it('should have all required properties for each card type', () => {
      Object.entries(CARD_TYPES).forEach(([type, data]) => {
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('width');
        expect(data).toHaveProperty('height');
        expect(data).toHaveProperty('description');
      });
    });
  });
});

describe('Base Tile Size Mapping', () => {
  it('should map base tile sizes to ship card types', () => {
    expect(BASE_TILE_SIZE_MAP['small']).toBe('small-ship');
    expect(BASE_TILE_SIZE_MAP['medium']).toBe('medium-ship');
    expect(BASE_TILE_SIZE_MAP['large']).toBe('large-ship');
    expect(BASE_TILE_SIZE_MAP['huge']).toBe('huge-ship');
  });

  it('should map to valid card types', () => {
    Object.values(BASE_TILE_SIZE_MAP).forEach(cardType => {
      expect(CARD_TYPES).toHaveProperty(cardType);
    });
  });
});

describe('Ship Name Settings', () => {
  it('should have different offsets for screen and PDF', () => {
    expect(SHIP_NAME_TOP_OFFSET_SCREEN_MM).toBeDefined();
    expect(SHIP_NAME_TOP_OFFSET_PDF_MM).toBeDefined();
    expect(SHIP_NAME_TOP_OFFSET_SCREEN_MM).not.toBe(SHIP_NAME_TOP_OFFSET_PDF_MM);
  });

  it('should have smaller font size in PDF than screen', () => {
    expect(SHIP_NAME_FONT_SIZE_PDF).toBeLessThan(SHIP_NAME_FONT_SIZE_SCREEN);
  });

  it('should have positive line height multiplier', () => {
    expect(SHIP_NAME_LINE_HEIGHT_MULTIPLIER).toBeGreaterThan(0);
    expect(SHIP_NAME_LINE_HEIGHT_MULTIPLIER).toBeLessThanOrEqual(2);
  });

  it('should have valid font family string', () => {
    expect(SHIP_NAME_FONT_FAMILY).toBeTruthy();
    expect(typeof SHIP_NAME_FONT_FAMILY).toBe('string');
  });
});

describe('Auto-placement Settings', () => {
  it('should have reasonable padding value', () => {
    expect(AUTO_PLACEMENT_PADDING).toBeGreaterThanOrEqual(0);
    expect(AUTO_PLACEMENT_PADDING).toBeLessThanOrEqual(50);
  });

  it('should have positive grid step multiplier', () => {
    expect(AUTO_PLACEMENT_GRID_STEP).toBeGreaterThan(0);
  });

  it('should have reasonable max attempts limit', () => {
    expect(COLLISION_SEARCH_MAX_ATTEMPTS).toBeGreaterThan(0);
    expect(COLLISION_SEARCH_MAX_ATTEMPTS).toBeLessThanOrEqual(1000);
  });
});

describe('Canvas Rendering Settings', () => {
  it('should have positive text canvas scale', () => {
    expect(TEXT_CANVAS_SCALE).toBeGreaterThan(0);
  });

  it('should use scale of 2 or more for crisp rendering', () => {
    expect(TEXT_CANVAS_SCALE).toBeGreaterThanOrEqual(2);
  });
});

describe('Physical Dimension Calculations', () => {
  it('should allow cards to fit on A4 paper', () => {
    // Standard card should fit multiple times on A4
    const standardCard = CARD_TYPES['standard'];
    const cardsPerRow = Math.floor(A4_WIDTH_MM / standardCard.width);
    const cardsPerColumn = Math.floor(A4_HEIGHT_MM / standardCard.height);

    expect(cardsPerRow).toBeGreaterThanOrEqual(3);
    expect(cardsPerColumn).toBeGreaterThanOrEqual(2);
  });

  it('should allow huge ships to fit on A4 paper', () => {
    const hugeShip = CARD_TYPES['huge-ship'];

    // Huge ship should fit at least once
    expect(hugeShip.width).toBeLessThan(A4_WIDTH_MM);
    expect(hugeShip.height).toBeLessThan(A4_WIDTH_MM); // Can be rotated
  });
});
