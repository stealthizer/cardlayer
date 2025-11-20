// Configuration file for Cardlayer application

// A4 dimensions in mm (horizontal/landscape mode)
const A4_WIDTH_MM = 297;  // Landscape width
const A4_HEIGHT_MM = 210; // Landscape height
const DPI = 96;

// Card type definitions
const CARD_TYPES = {
    'standard': {
        name: 'Standard Card',
        width: 63.5,
        height: 88,
        description: '63.5mm × 88mm (vertical) or 88mm × 63.5mm (horizontal)'
    },
    'small-ship': {
        name: 'Small Ship (X-Wing)',
        width: 32,
        height: 38,
        description: '32mm × 38mm'
    },
    'medium-ship': {
        name: 'Medium Ship (X-Wing)',
        width: 54,
        height: 61,
        description: '54mm × 61mm'
    },
    'large-ship': {
        name: 'Large Ship (X-Wing)',
        width: 73,
        height: 80,
        description: '73mm × 80mm'
    },
    'inner-dial': {
        name: 'Inner Dial (X-Wing)',
        width: 43,
        height: 43,
        description: '43mm diameter (round)'
    },
    'front-dial': {
        name: 'Front Dial (X-Wing)',
        width: 50,
        height: 50,
        description: '50mm diameter (round)'
    },
    'huge-ship': {
        name: 'Huge Ship (X-Wing)',
        width: 80.5,
        height: 224,
        description: '80.5mm × 224mm'
    }
};

// Base tile size mapping to existing card types
// Maps size keywords to card types, using full dimensions (width × height)
const BASE_TILE_SIZE_MAP = {
    'small': 'small-ship',    // 32mm × 38mm
    'medium': 'medium-ship',  // 54mm × 61mm
    'large': 'large-ship',     // 73mm × 80mm
    'huge': 'huge-ship'       // 80.5 x 224mm
};

// Grid snapping settings
const GRID_SIZE = 10; // Grid size in pixels for snapping

// Layout settings
const TOOL_LAYOUT_WIDTH = 0.3;  // 30% of screen width
const A4_LAYOUT_WIDTH = 0.7;    // 70% of screen width
const LAYOUT_PADDING = 32;      // Padding in pixels
const BOTTOM_PADDING = 100;     // Bottom padding in pixels

// Clone offset settings
const CLONE_OFFSET_X = 20;  // Offset in pixels for cloned images (horizontal)
const CLONE_OFFSET_Y = 20;  // Offset in pixels for cloned images (vertical)

// Control button positioning
const CONTROL_OFFSET = 4;  // Offset in pixels from edges

// Ship name text settings for front dials
const SHIP_NAME_TOP_OFFSET_SCREEN_MM = 35.5;  // Position from top (screen display)
const SHIP_NAME_TOP_OFFSET_PDF_MM = 34;       // Position from top (PDF output)
const SHIP_NAME_FONT_SIZE_SCREEN = 12;        // Font size on screen in pixels
const SHIP_NAME_FONT_SIZE_PDF = 7.8;          // Font size in PDF in pixels (35% smaller)
const SHIP_NAME_LINE_HEIGHT_MULTIPLIER = 1.2;
const SHIP_NAME_MAX_WIDTH_SCREEN = 158;       // Maximum width in pixels (screen)
const SHIP_NAME_MAX_WIDTH_PDF = 102.7;        // Maximum width in pixels (PDF)
const SHIP_NAME_FONT_FAMILY = '"Bank Gothic", "BankGothic", "Arial Narrow", Arial, sans-serif';

// Auto-placement settings
const AUTO_PLACEMENT_PADDING = 10;  // Minimum padding between cards and canvas edges
const AUTO_PLACEMENT_GRID_STEP = 2;  // Grid step multiplier for placement algorithm
const COLLISION_SEARCH_MAX_ATTEMPTS = 50;  // Maximum attempts to find valid position

// Canvas rendering settings
const TEXT_CANVAS_SCALE = 2;  // Scale factor for crisp text rendering

// Application metadata
const LAST_UPDATED_DATE = '2025-11-20 12:00';  // Last update timestamp
