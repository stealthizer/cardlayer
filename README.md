# Cardlayer - A4 Trading Card Layout Tool

A **pure client-side** web application for positioning trading card images on A4 paper and generating PDF files for printing. **No server required** - everything runs in the browser!

## Features

- **Multi-Size Card Support**: Support for Standard Cards, X-Wing ships, and X-Wing dials
- **Drag & Drop Interface**: Import images by dragging and dropping them directly onto the A4 layout
- **A4 Layout Preview**: See exactly how your cards will appear on A4 paper (horizontal/landscape mode)
- **Smart Image Positioning**: Click and drag to reposition images with grid snapping
- **Image Rotation**: Rotate images 90° to change from vertical to horizontal orientation (excludes dials)
- **Card Type Selection**: Change card type of individual images after import with per-image dropdowns
- **Alpha Channel Processing**: Automatic border trimming for PNG images with transparency
- **Grid Snapping System**: Invisible 10px grid for perfect card alignment
- **Smart Collision Detection**: Prevents images from overlapping when positioning
- **PDF Generation**: Export your layout as a PDF file with proper image rotation and aspect ratio preservation
- **Responsive Design**: Works on different screen sizes with proportional scaling
- **No Build Process**: Just open the HTML file in any modern browser

## Interface Layout

The application consists of two main sections (simplified design):

1. **Tool Layout (30% left)**: Contains controls, image count, file importer, global card type selector, and PDF generation button
2. **A4 Layout (70% right)**: Interactive A4 paper preview where you position and rotate images with individual card type controls

## Card Specifications

### Standard Cards
- **Standard Card Size**: 63.5mm × 88mm (vertical orientation)
- **Rotated Card Size**: 88mm × 63.5mm (horizontal orientation)
- **Auto-Detection**: Automatically detects card orientation based on image aspect ratio
- **Proportional Scaling**: Cards are scaled to fit the A4 layout while maintaining proper proportions

### X-Wing Ships
- **Small Ship (X-Wing)**: 32mm × 38mm
- **Medium Ship (X-Wing)**: 54mm × 61mm
- **Large Ship (X-Wing)**: 73mm × 80mm
- **Rectangular Format**: Ships maintain their rectangular proportions

### X-Wing Dials
- **Inner Dial (X-Wing)**: 43mm diameter (round)
- **Front Dial (X-Wing)**: 50mm diameter (round)
- **Circular Format**: Dials maintain their round proportions
- **No Rotation**: Dials cannot be rotated (fixed orientation)
- **Aspect Ratio Preservation**: Front dial maintains natural aspect ratio in PDF output

## How to Run

### Option 1: Direct File Opening
Simply open `index.html` in any modern web browser:
- Double-click the file
- Or right-click → "Open with" → your preferred browser

### Option 2: Local Server (Optional)
If you prefer to serve it locally:
```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have it)
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Usage

1. **Select Card Type**: Choose the card type from the global dropdown in the tool layout for new imports
2. **Import Images**: Click "🃏 Import Cards" or drag & drop image files directly onto the A4 layout
3. **Position Images**: Click and drag to reposition images on the A4 layout (grid snapping enabled)
4. **Rotate Images**: Click the rotation indicator (↻) or double-click an image to rotate 90° (excludes dials)
5. **Change Card Type**: Hover over any image and use the individual dropdown to change its card type
6. **Remove Images**: Click the × button on any image to remove it
7. **Generate PDF**: Click "📄 Generate PDF" when you're ready to export

## Advanced Features

### Image Rotation
- **Visual Rotation**: Images rotate 90° with proper visual feedback
- **Dimension Handling**: Container dimensions adapt to rotated orientation
- **Control Positioning**: Rotation, card type, and remove controls stay in fixed positions
- **Collision Detection**: Uses correct dimensions for rotated images to prevent overlapping
- **PDF Generation**: Exports rotated images with correct dimensions and proper rotation
- **Dial Exclusion**: X-Wing dials (inner and front) cannot be rotated

### Grid Snapping System
- **Invisible Grid**: 10px grid system for perfect alignment
- **Automatic Snapping**: Images automatically snap to grid positions
- **Easy Alignment**: Cards align at the same level automatically
- **Consistent Positioning**: All cards follow the same grid system

### Smart Collision Detection
- **No Overlapping**: Prevents images from finishing movement on top of each other
- **Rotated Support**: Collision boundaries match rotated image orientation
- **Visual Accuracy**: Collision box matches the visible image area exactly
- **Boundary Checking**: Prevents images from going outside A4 bounds

### Alpha Channel Processing
- **PNG Support**: Automatically processes PNG images with alpha channels
- **Border Trimming**: Removes transparent borders around card images
- **Transparency Preservation**: Maintains transparency in rotated images
- **Pre-processing**: Trims borders before resizing to standard card dimensions

### Card Type Management
- **Multiple Types**: Support for Standard Cards, X-Wing ships, and X-Wing dials
- **Global Selection**: Choose card type for new imports via tool layout dropdown
- **Individual Control**: Change card type of any image after import via per-image dropdown
- **Visual Feedback**: Controls appear on hover for clean interface
- **Real-time Updates**: Images resize and reposition automatically when type changes
- **Type-Specific Behavior**: Dials use `object-fit: contain`, cards use `object-fit: cover`

## Technical Details

- **Pure HTML/CSS/JavaScript** - no frameworks or build tools
- **CDN Dependencies**: Tailwind CSS and pdf-lib loaded from CDN
- **Client-side only** - no server backend required
- **A4 Dimensions**: 297mm × 210mm (horizontal/landscape mode)
- **PDF Generation**: Uses pdf-lib library with canvas-based image rotation
- **Grid System**: 10px invisible grid for precise positioning
- **Collision Detection**: Real-time collision prevention with effective dimensions
- **Responsive Scaling**: A4 layout scales to fit screen with 100px bottom padding

## Recent Updates

- **PDF Library Migration** (2025-11-15): Migrated from jsPDF to pdf-lib for better compression, smaller file sizes, and improved PDF structure
- **Multi-Size Card Support**: Added support for Standard Cards, X-Wing ships, and X-Wing dials
- **Card Type Selection**: Global and individual card type dropdowns for flexible image management
- **Alpha Channel Processing**: Automatic PNG border trimming and transparency preservation
- **Enhanced Rotation**: Complete image rotation system with proper visual feedback (excludes dials)
- **Grid Snapping**: Invisible 10px grid system for perfect card alignment
- **Smart Collision**: Advanced collision detection for both normal and rotated images
- **PDF Rotation**: Proper image content rotation in PDF generation with canvas-based rotation
- **Position Mapping**: Accurate position mapping between A4 layout and PDF
- **Control Positioning**: Fixed control positions regardless of image rotation
- **Bottom Padding**: Added 100px bottom padding for better screen utilization
- **Aspect Ratio Preservation**: Images maintain proper proportions when rotated
- **Dial Support**: Added Inner Dial (43mm) and Front Dial (50mm) with proper aspect ratio handling
- **Type-Specific Rendering**: Different object-fit behavior for dials vs cards
- **Merge Conflict Resolution**: Cleaned up codebase and consolidated all features

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Structure

```
Cardlayer/
├── index.html                    # Single HTML file containing everything
├── README.md                    # This file
└── .gitignore                   # Git ignore file
```

## No Installation Required!

This is a **zero-dependency** solution. Just open `index.html` in your browser and start using it immediately. Perfect for:
- Quick prototyping
- Offline use
- Sharing via email or USB drive
- Embedding in other projects

## License

MIT License

---

## Development Recommendations & Roadmap

### High Priority Improvements

#### 1. Error Handling
- Add try-catch blocks throughout the application
- Specific locations needing error handling:
  - `trimImageBorders()` - canvas operations can fail
  - `generatePDF()` - image loading/PDF creation can fail
  - `processFiles()` - file reading can fail
  - Image loading in rotation operations
- Display user-friendly error messages for failed operations

#### 2. Loading States & User Feedback
- Add loading overlay during PDF generation
- Show progress indicators for large file processing
- Display file count and processing status during import
- Add success/error notifications after operations

#### 3. Input Validation
- Validate file sizes (recommend max 10MB per image)
- Validate image dimensions (recommend max 4096px)
- Check file types before processing
- Warn users about memory usage with many large images

#### 4. PDF Generation Enhancement ✅ **COMPLETED**
- **Migrated from jsPDF to pdf-lib** for better:
  - Compression and smaller file sizes
  - Native rotation handling
  - Better image quality preservation
  - Improved PDF structure and compatibility
- Simplified rotation logic with better canvas handling
- Maintained WYSIWYG text rendering for ship names (rendered as images for font consistency)

### Medium Priority Improvements

#### 1. Code Organization
- Separate single HTML file into modular structure:
  - `css/styles.css` - All styling
  - `js/config.js` - Constants and card type definitions
  - `js/imageProcessor.js` - Image processing functions
  - `js/cardManager.js` - Card management logic
  - `js/dragDrop.js` - Drag/drop/collision detection
  - `js/pdfGenerator.js` - PDF generation
  - `js/main.js` - Initialization and event listeners

#### 2. Performance Optimizations
- Debounce window resize events (currently causes lag)
- Optimize `trimImageBorders()` with downsampled detection
- Use `requestAnimationFrame` for smoother drag operations
- Consider `URL.createObjectURL()` instead of data URLs to reduce memory usage

#### 3. Keyboard Shortcuts
- `Delete` - Remove selected image
- `R` - Rotate selected image
- `Ctrl+S` - Generate PDF
- `Ctrl+Z` / `Ctrl+Y` - Undo/Redo
- Arrow keys - Nudge selected image position

#### 4. Enhanced UI/UX
- Add zoom controls for A4 layout
- Show dimension tooltips during drag
- Highlight selected image with border
- Add ruler guides along A4 edges
- Multi-select support (Shift+click)

### Low Priority Improvements (Nice to Have)

#### 1. Undo/Redo System
- Implement history stack for all operations
- Track position changes, rotations, additions, deletions
- Keyboard shortcuts for quick access
- Visual indication of undo/redo availability

#### 2. Save/Load Layouts
- Export layout as JSON with embedded images
- Import previously saved layouts
- Auto-save to localStorage
- Template system for common layouts

#### 3. Advanced Features
- Snap-to-card alignment (not just grid)
- Distribution tools (align left/right/center, space evenly)
- Duplicate layout across multiple pages
- Print preview mode
- Export as PNG/JPG image instead of PDF
- Batch import with automatic layout

#### 4. Accessibility Improvements
- Full keyboard navigation support
- Screen reader announcements for operations
- High contrast mode option
- Configurable font sizes for UI

### Performance Targets
- Import processing: <500ms per image
- PDF generation: <2s for 20 cards
- Drag operations: 60fps
- Window resize: <100ms response

### Memory Management
- Monitor and display memory usage
- Warn when approaching browser limits
- Implement image cleanup for removed cards
- Add "Optimize Images" feature to reduce memory footprint

### Browser Compatibility
- Test and document mobile browser support
- Add touch gesture support for tablets
- Implement PWA features for offline use
- Add iOS Safari workarounds if needed